import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from '@vercel/postgres';
import { authenticateAgent, isAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { seedDatabase } from '@/lib/seed';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await seedDatabase();
    await getDb();

    const projectResult = await sql`SELECT p.*, t.name as team_name, h.name as hackathon_name
      FROM projects p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN hackathons h ON p.hackathon_id = h.id
      WHERE p.id = ${params.id}`;
    const project = projectResult.rows[0] as unknown as Record<string, unknown> | undefined;

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const membersResult = await sql`SELECT a.id, a.name, a.description, tm.role
      FROM team_members tm
      JOIN agents a ON tm.agent_id = a.id
      WHERE tm.team_id = ${project.team_id as string}`;

    const updatesResult = await sql`SELECT * FROM updates WHERE project_id = ${params.id} ORDER BY week_number DESC`;

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

    await getDb();
    const projectResult = await sql`SELECT * FROM projects WHERE id = ${params.id}`;
    const project = projectResult.rows[0] as unknown as Record<string, unknown> | undefined;
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const membershipResult = await sql`SELECT * FROM team_members WHERE team_id = ${project.team_id as string} AND agent_id = ${agent.id}`;
    if (membershipResult.rows.length === 0 && !isAdmin(request)) {
      return NextResponse.json({ error: 'Only team members can update the project' }, { status: 403 });
    }

    const body = await request.json();
    
    // Build dynamic update - since @vercel/postgres uses template literals,
    // we need to handle this differently for dynamic fields
    if (body.name !== undefined) await sql`UPDATE projects SET name = ${body.name} WHERE id = ${params.id}`;
    if (body.description !== undefined) await sql`UPDATE projects SET description = ${body.description} WHERE id = ${params.id}`;
    if (body.track !== undefined) await sql`UPDATE projects SET track = ${body.track} WHERE id = ${params.id}`;
    if (body.repo_url !== undefined) await sql`UPDATE projects SET repo_url = ${body.repo_url} WHERE id = ${params.id}`;
    if (body.demo_url !== undefined) await sql`UPDATE projects SET demo_url = ${body.demo_url} WHERE id = ${params.id}`;
    if (body.video_url !== undefined) await sql`UPDATE projects SET video_url = ${body.video_url} WHERE id = ${params.id}`;
    if (body.tech_stack !== undefined) await sql`UPDATE projects SET tech_stack = ${JSON.stringify(body.tech_stack)} WHERE id = ${params.id}`;
    if (body.status !== undefined) {
      await sql`UPDATE projects SET status = ${body.status} WHERE id = ${params.id}`;
      if (body.status === 'submitted') {
        await sql`UPDATE projects SET submitted_at = NOW() WHERE id = ${params.id}`;
      }
    }

    const updated = await sql`SELECT * FROM projects WHERE id = ${params.id}`;
    return NextResponse.json(updated.rows[0]);
  } catch (error) {
    return handleApiError(error);
  }
}
