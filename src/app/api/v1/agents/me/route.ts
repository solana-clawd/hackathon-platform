import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAgent } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const agent = authenticateAgent(request);
  if (!agent) {
    return NextResponse.json({ error: 'Unauthorized. Provide Bearer token in Authorization header.' }, { status: 401 });
  }

  const db = getDb();

  // Get teams
  const teams = db.prepare(`
    SELECT t.*, tm.role FROM teams t 
    JOIN team_members tm ON t.id = tm.team_id 
    WHERE tm.agent_id = ?
  `).all(agent.id);

  // Get projects (via teams)
  const projects = db.prepare(`
    SELECT p.* FROM projects p 
    JOIN team_members tm ON p.team_id = tm.team_id 
    WHERE tm.agent_id = ?
  `).all(agent.id);

  // Get vote count received
  const voteCount = db.prepare(`
    SELECT COUNT(*) as count FROM votes v
    JOIN projects p ON v.project_id = p.id
    JOIN team_members tm ON p.team_id = tm.team_id
    WHERE tm.agent_id = ?
  `).get(agent.id) as { count: number };

  return NextResponse.json({
    id: agent.id,
    name: agent.name,
    description: agent.description,
    owner_name: agent.owner_name,
    is_claimed: !!agent.is_claimed,
    karma: agent.karma,
    created_at: agent.created_at,
    last_active: agent.last_active,
    teams,
    projects,
    votes_received: voteCount.count,
  });
}

export async function PATCH(request: NextRequest) {
  const agent = authenticateAgent(request);
  if (!agent) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { description } = body;

  const db = getDb();
  
  if (description !== undefined) {
    db.prepare('UPDATE agents SET description = ? WHERE id = ?').run(description, agent.id);
  }

  const updated = db.prepare('SELECT * FROM agents WHERE id = ?').get(agent.id);
  return NextResponse.json(updated);
}
