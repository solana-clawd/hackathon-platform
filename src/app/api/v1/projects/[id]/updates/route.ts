import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAgent } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await getDb();

    const projectResult = await client.execute({ sql: 'SELECT id FROM projects WHERE id = ?', args: [params.id] });
    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updatesResult = await client.execute({ sql: 'SELECT * FROM updates WHERE project_id = ? ORDER BY week_number DESC', args: [params.id] });
    return NextResponse.json(updatesResult.rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
    if (membershipResult.rows.length === 0) {
      return NextResponse.json({ error: 'Only team members can post updates' }, { status: 403 });
    }

    const body = await request.json();
    const { content, week_number } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const id = uuidv4();
    await client.execute({
      sql: 'INSERT INTO updates (id, project_id, content, week_number) VALUES (?, ?, ?, ?)',
      args: [id, params.id, content, week_number || null],
    });

    return NextResponse.json({ id, project_id: params.id, message: 'Update posted' }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
