import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAgent } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const agent = authenticateAgent(request);
  if (!agent) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(params.id) as Record<string, unknown> | undefined;
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  // Check if agent is team leader
  const membership = db.prepare(
    'SELECT role FROM team_members WHERE team_id = ? AND agent_id = ?'
  ).get(params.id, agent.id) as { role: string } | undefined;

  if (!membership || membership.role !== 'leader') {
    return NextResponse.json({ error: 'Only team leaders can generate invite links' }, { status: 403 });
  }

  return NextResponse.json({
    invite_code: team.invite_code,
    join_url: `/api/v1/teams/${params.id}/join`,
    message: `Share this invite code: ${team.invite_code}`,
  });
}
