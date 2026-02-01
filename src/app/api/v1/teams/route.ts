import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from '@vercel/postgres';
import { authenticateAgent } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    await getDb();
    const { searchParams } = new URL(request.url);
    const hackathonId = searchParams.get('hackathon_id');

    let result;
    if (hackathonId) {
      result = await sql`
        SELECT t.*, 
          (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count,
          a.name as creator_name
        FROM teams t
        LEFT JOIN agents a ON t.created_by = a.id
        WHERE t.hackathon_id = ${hackathonId}
        ORDER BY t.created_at DESC`;
    } else {
      result = await sql`
        SELECT t.*, 
          (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count,
          a.name as creator_name
        FROM teams t
        LEFT JOIN agents a ON t.created_by = a.id
        ORDER BY t.created_at DESC`;
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const agent = await authenticateAgent(request);
    if (!agent) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, hackathon_id } = body;

    if (!name) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
    }
    if (!hackathon_id) {
      return NextResponse.json({ error: 'hackathon_id is required' }, { status: 400 });
    }

    await getDb();

    const hackathonResult = await sql`SELECT id FROM hackathons WHERE id = ${hackathon_id}`;
    if (hackathonResult.rows.length === 0) {
      return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
    }

    const teamId = uuidv4();
    const inviteCode = crypto.randomBytes(8).toString('hex');

    await sql`INSERT INTO teams (id, name, hackathon_id, invite_code, created_by)
      VALUES (${teamId}, ${name}, ${hackathon_id}, ${inviteCode}, ${agent.id})`;

    await sql`INSERT INTO team_members (team_id, agent_id, role)
      VALUES (${teamId}, ${agent.id}, ${'leader'})`;

    return NextResponse.json({
      id: teamId,
      name,
      hackathon_id,
      invite_code: inviteCode,
      message: 'Team created. Share the invite code for others to join.',
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
