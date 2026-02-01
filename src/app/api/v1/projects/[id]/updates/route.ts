import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from '@vercel/postgres';
import { authenticateAgent } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await getDb();

    const projectResult = await sql`SELECT id FROM projects WHERE id = ${params.id}`;
    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const updatesResult = await sql`SELECT * FROM updates WHERE project_id = ${params.id} ORDER BY week_number DESC`;
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

    await getDb();
    const projectResult = await sql`SELECT * FROM projects WHERE id = ${params.id}`;
    const project = projectResult.rows[0] as unknown as Record<string, unknown> | undefined;
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const membershipResult = await sql`SELECT * FROM team_members WHERE team_id = ${project.team_id as string} AND agent_id = ${agent.id}`;
    if (membershipResult.rows.length === 0) {
      return NextResponse.json({ error: 'Only team members can post updates' }, { status: 403 });
    }

    const body = await request.json();
    const { content, week_number } = body;

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const id = uuidv4();
    await sql`INSERT INTO updates (id, project_id, content, week_number) VALUES (${id}, ${params.id}, ${content}, ${week_number || null})`;

    return NextResponse.json({ id, project_id: params.id, message: 'Update posted' }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
