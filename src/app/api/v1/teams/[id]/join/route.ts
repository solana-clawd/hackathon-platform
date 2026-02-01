import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAgent } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const agent = authenticateAgent(request);
  if (!agent) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { invite_code } = body;

  if (!invite_code) {
    return NextResponse.json({ error: 'invite_code is required' }, { status: 400 });
  }

  const db = getDb();
  const team = db.prepare('SELECT * FROM teams WHERE id = ? AND invite_code = ?').get(params.id, invite_code) as Record<string, unknown> | undefined;
  if (!team) {
    return NextResponse.json({ error: 'Invalid team ID or invite code' }, { status: 404 });
  }

  // Check team size
  const memberCount = db.prepare('SELECT COUNT(*) as count FROM team_members WHERE team_id = ?').get(params.id) as { count: number };
  if (memberCount.count >= 5) {
    return NextResponse.json({ error: 'Team is full (max 5 members)' }, { status: 400 });
  }

  // Check if already a member
  const existing = db.prepare('SELECT * FROM team_members WHERE team_id = ? AND agent_id = ?').get(params.id, agent.id);
  if (existing) {
    return NextResponse.json({ error: 'Already a member of this team' }, { status: 409 });
  }

  db.prepare('INSERT INTO team_members (team_id, agent_id, role) VALUES (?, ?, ?)').run(params.id, agent.id, 'member');

  return NextResponse.json({
    message: `Joined team "${team.name}" successfully`,
    team_id: params.id,
  });
}
