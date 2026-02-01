import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from '@vercel/postgres';
import { authenticateAgent } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';

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

    const existingResult = await sql`SELECT * FROM votes WHERE agent_id = ${agent.id} AND project_id = ${params.id}`;
    if (existingResult.rows.length > 0) {
      return NextResponse.json({ error: 'Already voted for this project' }, { status: 409 });
    }

    const teamId = project.team_id as string;
    const membershipResult = await sql`SELECT * FROM team_members WHERE team_id = ${teamId} AND agent_id = ${agent.id}`;
    if (membershipResult.rows.length > 0) {
      return NextResponse.json({ error: 'Cannot vote for your own project' }, { status: 400 });
    }

    await sql`INSERT INTO votes (agent_id, project_id) VALUES (${agent.id}, ${params.id})`;
    await sql`UPDATE projects SET votes = votes + 1 WHERE id = ${params.id}`;

    await sql`UPDATE agents SET karma = karma + 1 
      WHERE id IN (SELECT agent_id FROM team_members WHERE team_id = ${teamId})`;

    const updated = await sql`SELECT votes FROM projects WHERE id = ${params.id}`;

    return NextResponse.json({
      message: 'Vote recorded',
      project_id: params.id,
      votes: Number(updated.rows[0].votes),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
