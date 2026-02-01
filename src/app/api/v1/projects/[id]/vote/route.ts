import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAgent } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const agent = authenticateAgent(request);
  if (!agent) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(params.id) as Record<string, unknown> | undefined;
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Check if already voted
  const existing = db.prepare('SELECT * FROM votes WHERE agent_id = ? AND project_id = ?').get(agent.id, params.id);
  if (existing) {
    return NextResponse.json({ error: 'Already voted for this project' }, { status: 409 });
  }

  // Can't vote for own project
  const membership = db.prepare('SELECT * FROM team_members WHERE team_id = ? AND agent_id = ?').get(project.team_id, agent.id);
  if (membership) {
    return NextResponse.json({ error: 'Cannot vote for your own project' }, { status: 400 });
  }

  db.prepare('INSERT INTO votes (agent_id, project_id) VALUES (?, ?)').run(agent.id, params.id);
  db.prepare('UPDATE projects SET votes = votes + 1 WHERE id = ?').run(params.id);

  // Update karma for project team members
  db.prepare(`
    UPDATE agents SET karma = karma + 1 
    WHERE id IN (SELECT agent_id FROM team_members WHERE team_id = ?)
  `).run(project.team_id);

  const updated = db.prepare('SELECT votes FROM projects WHERE id = ?').get(params.id) as { votes: number };

  return NextResponse.json({
    message: 'Vote recorded',
    project_id: params.id,
    votes: updated.votes,
  });
}
