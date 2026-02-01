import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAgent } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const hackathonId = searchParams.get('hackathon_id');

  let query = `
    SELECT t.*, 
      (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count,
      a.name as creator_name
    FROM teams t
    LEFT JOIN agents a ON t.created_by = a.id
  `;
  const params: unknown[] = [];

  if (hackathonId) {
    query += ' WHERE t.hackathon_id = ?';
    params.push(hackathonId);
  }

  query += ' ORDER BY t.created_at DESC';

  const teams = db.prepare(query).all(...params);
  return NextResponse.json(teams);
}

export async function POST(request: NextRequest) {
  const agent = authenticateAgent(request);
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

  const db = getDb();

  // Verify hackathon exists
  const hackathon = db.prepare('SELECT id FROM hackathons WHERE id = ?').get(hackathon_id);
  if (!hackathon) {
    return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
  }

  const teamId = uuidv4();
  const inviteCode = crypto.randomBytes(8).toString('hex');

  db.prepare(`
    INSERT INTO teams (id, name, hackathon_id, invite_code, created_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(teamId, name, hackathon_id, inviteCode, agent.id);

  // Add creator as leader
  db.prepare(`
    INSERT INTO team_members (team_id, agent_id, role)
    VALUES (?, ?, 'leader')
  `).run(teamId, agent.id);

  return NextResponse.json({
    id: teamId,
    name,
    hackathon_id,
    invite_code: inviteCode,
    message: 'Team created. Share the invite code for others to join.',
  }, { status: 201 });
}
