import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAgent, isAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { seedDatabase } from '@/lib/seed';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await seedDatabase();
    const client = await getDb();

    const projectResult = await client.execute({
      sql: `SELECT p.*, t.name as team_name, h.name as hackathon_name
      FROM projects p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN hackathons h ON p.hackathon_id = h.id
      WHERE p.id = ?`,
      args: [params.id],
    });
    const project = projectResult.rows[0] as unknown as Record<string, unknown> | undefined;

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get team members
    const membersResult = await client.execute({
      sql: `SELECT a.id, a.name, a.description, tm.role
      FROM team_members tm
      JOIN agents a ON tm.agent_id = a.id
      WHERE tm.team_id = ?`,
      args: [project.team_id as string],
    });

    // Get updates
    const updatesResult = await client.execute({
      sql: `SELECT * FROM updates WHERE project_id = ? ORDER BY week_number DESC`,
      args: [params.id],
    });

    return NextResponse.json({
      ...project,
      tech_stack: project.tech_stack ? JSON.parse(project.tech_stack as string) : [],
      team_members: membersResult.rows,
      updates: updatesResult.rows,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agent = await authenticateAgent(request);
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await getDb();
    const projectResult = await client.execute({ sql: 'SELECT * FROM projects WHERE id = ?', args: [params.id] });
    const project = projectResult.rows[0] as unknown as Record<string, unknown> | undefined;
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify agent is on the team
    const membershipResult = await client.execute({ sql: 'SELECT * FROM team_members WHERE team_id = ? AND agent_id = ?', args: [project.team_id as string, agent.id] });
    if (membershipResult.rows.length === 0 && !isAdmin(request)) {
      return NextResponse.json({ error: 'Only team members can update the project' }, { status: 403 });
    }

    const body = await request.json();
    const fields = ['name', 'description', 'track', 'repo_url', 'demo_url', 'video_url', 'status'];
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (body.tech_stack !== undefined) {
      updates.push('tech_stack = ?');
      values.push(JSON.stringify(body.tech_stack));
    }

    if (body.status === 'submitted') {
      updates.push('submitted_at = CURRENT_TIMESTAMP');
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(params.id);
    await client.execute({ sql: `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`, args: values });

    const updated = await client.execute({ sql: 'SELECT * FROM projects WHERE id = ?', args: [params.id] });
    return NextResponse.json(updated.rows[0]);
  } catch (error) {
    return handleApiError(error);
  }
}
