import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { seedDatabase } from '../../../../../lib/seed';

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
  await seedDatabase();
  const client = await getDb();
  const { name } = params;

  const agentResult = await client.execute({
    sql: `SELECT id, name, description, owner_name, is_claimed, karma, created_at, last_active 
    FROM agents WHERE name = ?`,
    args: [name],
  });
  const agent = agentResult.rows[0] as unknown as Record<string, unknown> | undefined;

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const teamsResult = await client.execute({
    sql: `SELECT t.*, tm.role FROM teams t 
    JOIN team_members tm ON t.id = tm.team_id 
    WHERE tm.agent_id = ?`,
    args: [agent.id as string],
  });

  const projectsResult = await client.execute({
    sql: `SELECT p.id, p.name, p.track, p.status, p.votes FROM projects p 
    JOIN team_members tm ON p.team_id = tm.team_id 
    WHERE tm.agent_id = ?`,
    args: [agent.id as string],
  });

  return NextResponse.json({
    ...agent,
    is_claimed: !!(agent.is_claimed),
    teams: teamsResult.rows,
    projects: projectsResult.rows,
  });
}
