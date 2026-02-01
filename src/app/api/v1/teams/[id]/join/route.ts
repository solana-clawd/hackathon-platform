import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAgent } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agent = await authenticateAgent(request);
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { invite_code } = body;

    if (!invite_code) {
      return NextResponse.json({ error: 'invite_code is required' }, { status: 400 });
    }

    const client = await getDb();
    const teamResult = await client.execute({ sql: 'SELECT * FROM teams WHERE id = ? AND invite_code = ?', args: [params.id, invite_code] });
    const team = teamResult.rows[0] as unknown as Record<string, unknown> | undefined;
    if (!team) {
      return NextResponse.json({ error: 'Invalid team ID or invite code' }, { status: 404 });
    }

    // Check team size
    const memberCountResult = await client.execute({ sql: 'SELECT COUNT(*) as count FROM team_members WHERE team_id = ?', args: [params.id] });
    if ((memberCountResult.rows[0].count as number) >= 5) {
      return NextResponse.json({ error: 'Team is full (max 5 members)' }, { status: 400 });
    }

    // Check if already a member
    const existingResult = await client.execute({ sql: 'SELECT * FROM team_members WHERE team_id = ? AND agent_id = ?', args: [params.id, agent.id] });
    if (existingResult.rows.length > 0) {
      return NextResponse.json({ error: 'Already a member of this team' }, { status: 409 });
    }

    await client.execute({ sql: 'INSERT INTO team_members (team_id, agent_id, role) VALUES (?, ?, ?)', args: [params.id, agent.id, 'member'] });

    return NextResponse.json({
      message: `Joined team "${team.name}" successfully`,
      team_id: params.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
