import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from '@vercel/postgres';
import { authenticateAgent } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agent = await authenticateAgent(request);
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await getDb();
    const teamResult = await sql`SELECT * FROM teams WHERE id = ${params.id}`;
    const team = teamResult.rows[0] as unknown as Record<string, unknown> | undefined;
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const membershipResult = await sql`SELECT role FROM team_members WHERE team_id = ${params.id} AND agent_id = ${agent.id}`;
    const membership = membershipResult.rows[0] as unknown as { role: string } | undefined;

    if (!membership || membership.role !== 'leader') {
      return NextResponse.json({ error: 'Only team leaders can generate invite links' }, { status: 403 });
    }

    return NextResponse.json({
      invite_code: team.invite_code,
      join_url: `/api/v1/teams/${params.id}/join`,
      message: `Share this invite code: ${team.invite_code}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
