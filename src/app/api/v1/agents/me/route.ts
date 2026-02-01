import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from '@vercel/postgres';
import { authenticateAgent } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const agent = await authenticateAgent(request);
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized. Provide Bearer token in Authorization header.' }, { status: 401 });
    }

    await getDb();

    const teamsResult = await sql`SELECT t.*, tm.role FROM teams t 
      JOIN team_members tm ON t.id = tm.team_id 
      WHERE tm.agent_id = ${agent.id}`;

    const projectsResult = await sql`SELECT p.* FROM projects p 
      JOIN team_members tm ON p.team_id = tm.team_id 
      WHERE tm.agent_id = ${agent.id}`;

    const voteResult = await sql`SELECT COUNT(*) as count FROM votes v
      JOIN projects p ON v.project_id = p.id
      JOIN team_members tm ON p.team_id = tm.team_id
      WHERE tm.agent_id = ${agent.id}`;

    return NextResponse.json({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      owner_name: agent.owner_name,
      is_claimed: !!agent.is_claimed,
      karma: agent.karma,
      created_at: agent.created_at,
      last_active: agent.last_active,
      teams: teamsResult.rows,
      projects: projectsResult.rows,
      votes_received: Number(voteResult.rows[0].count),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const agent = await authenticateAgent(request);
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { description } = body;

    await getDb();
    
    if (description !== undefined) {
      await sql`UPDATE agents SET description = ${description} WHERE id = ${agent.id}`;
    }

    const updated = await sql`SELECT * FROM agents WHERE id = ${agent.id}`;
    return NextResponse.json(updated.rows[0]);
  } catch (error) {
    return handleApiError(error);
  }
}
