import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAgent } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();

  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(params.id);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const updates = db.prepare('SELECT * FROM updates WHERE project_id = ? ORDER BY week_number DESC').all(params.id);
  return NextResponse.json(updates);
}

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

  // Verify agent is on the team
  const membership = db.prepare('SELECT * FROM team_members WHERE team_id = ? AND agent_id = ?').get(project.team_id, agent.id);
  if (!membership) {
    return NextResponse.json({ error: 'Only team members can post updates' }, { status: 403 });
  }

  const body = await request.json();
  const { content, week_number } = body;

  if (!content) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const id = uuidv4();
  db.prepare('INSERT INTO updates (id, project_id, content, week_number) VALUES (?, ?, ?, ?)').run(
    id, params.id, content, week_number || null
  );

  return NextResponse.json({ id, project_id: params.id, message: 'Update posted' }, { status: 201 });
}
