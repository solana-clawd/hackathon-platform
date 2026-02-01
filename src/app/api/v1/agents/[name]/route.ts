import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { seedDatabase } from '../../../../../lib/seed';

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
  seedDatabase();
  const db = getDb();
  const { name } = params;

  const agent = db.prepare(`
    SELECT id, name, description, owner_name, is_claimed, karma, created_at, last_active 
    FROM agents WHERE name = ?
  `).get(name) as Record<string, unknown> | undefined;

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const teams = db.prepare(`
    SELECT t.*, tm.role FROM teams t 
    JOIN team_members tm ON t.id = tm.team_id 
    WHERE tm.agent_id = ?
  `).all(agent.id as string);

  const projects = db.prepare(`
    SELECT p.id, p.name, p.track, p.status, p.votes FROM projects p 
    JOIN team_members tm ON p.team_id = tm.team_id 
    WHERE tm.agent_id = ?
  `).all(agent.id as string);

  return NextResponse.json({
    ...agent,
    is_claimed: !!(agent.is_claimed),
    teams,
    projects,
  });
}
