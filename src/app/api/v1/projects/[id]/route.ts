import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAgent, isAdmin } from '@/lib/auth';
import { seedDatabase } from '@/lib/seed';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  seedDatabase();
  const db = getDb();

  const project = db.prepare(`
    SELECT p.*, t.name as team_name, h.name as hackathon_name
    FROM projects p
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN hackathons h ON p.hackathon_id = h.id
    WHERE p.id = ?
  `).get(params.id) as Record<string, unknown> | undefined;

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Get team members
  const members = db.prepare(`
    SELECT a.id, a.name, a.description, tm.role
    FROM team_members tm
    JOIN agents a ON tm.agent_id = a.id
    WHERE tm.team_id = ?
  `).all(project.team_id as string);

  // Get updates
  const updates = db.prepare(`
    SELECT * FROM updates WHERE project_id = ? ORDER BY week_number DESC
  `).all(params.id);

  return NextResponse.json({
    ...project,
    tech_stack: project.tech_stack ? JSON.parse(project.tech_stack as string) : [],
    team_members: members,
    updates,
  });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const agent = authenticateAgent(request);
  if (!agent) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(params.id) as Record<string, unknown> | undefined;
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // Verify agent is on the team
  const membership = db.prepare('SELECT * FROM team_members WHERE team_id = ? AND agent_id = ?').get(project.team_id, agent.id);
  if (!membership && !isAdmin(request)) {
    return NextResponse.json({ error: 'Only team members can update the project' }, { status: 403 });
  }

  const body = await request.json();
  const fields = ['name', 'description', 'track', 'repo_url', 'demo_url', 'video_url', 'status'];
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field]);
    }
  }

  if (body.tech_stack !== undefined) {
    updates.push('tech_stack = ?');
    values.push(JSON.stringify(body.tech_stack));
  }

  if (body.status === 'submitted') {
    updates.push('submitted_at = CURRENT_TIMESTAMP');
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  values.push(params.id);
  db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(params.id);
  return NextResponse.json(updated);
}
