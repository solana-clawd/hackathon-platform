import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAgent } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) {
    return NextResponse.json({ error: 'Unauthorized. Provide Bearer token in Authorization header.' }, { status: 401 });
  }

  const client = await getDb();

  // Get teams
  const teamsResult = await client.execute({
    sql: `SELECT t.*, tm.role FROM teams t 
    JOIN team_members tm ON t.id = tm.team_id 
    WHERE tm.agent_id = ?`,
    args: [agent.id],
  });

  // Get projects (via teams)
  const projectsResult = await client.execute({
    sql: `SELECT p.* FROM projects p 
    JOIN team_members tm ON p.team_id = tm.team_id 
    WHERE tm.agent_id = ?`,
    args: [agent.id],
  });

  // Get vote count received
  const voteResult = await client.execute({
    sql: `SELECT COUNT(*) as count FROM votes v
    JOIN projects p ON v.project_id = p.id
    JOIN team_members tm ON p.team_id = tm.team_id
    WHERE tm.agent_id = ?`,
    args: [agent.id],
  });

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
    votes_received: voteResult.rows[0].count as number,
  });
}

export async function PATCH(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { description } = body;

  const client = await getDb();
  
  if (description !== undefined) {
    await client.execute({ sql: 'UPDATE agents SET description = ? WHERE id = ?', args: [description, agent.id] });
  }

  const updated = await client.execute({ sql: 'SELECT * FROM agents WHERE id = ?', args: [agent.id] });
  return NextResponse.json(updated.rows[0]);
}
