import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAgent } from '@/lib/auth';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const agent = await authenticateAgent(request);
  if (!agent) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = await getDb();
  const teamResult = await client.execute({ sql: 'SELECT * FROM teams WHERE id = ?', args: [params.id] });
  const team = teamResult.rows[0] as unknown as Record<string, unknown> | undefined;
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  // Check if agent is team leader
  const membershipResult = await client.execute({
    sql: 'SELECT role FROM team_members WHERE team_id = ? AND agent_id = ?',
    args: [params.id, agent.id],
  });
  const membership = membershipResult.rows[0] as unknown as { role: string } | undefined;

  if (!membership || membership.role !== 'leader') {
    return NextResponse.json({ error: 'Only team leaders can generate invite links' }, { status: 403 });
  }

  return NextResponse.json({
    invite_code: team.invite_code,
    join_url: `/api/v1/teams/${params.id}/join`,
    message: `Share this invite code: ${team.invite_code}`,
  });
}
