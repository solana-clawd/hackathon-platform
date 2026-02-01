import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateAgent } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { seedDatabase } from '@/lib/seed';

export async function GET(request: NextRequest) {
  await seedDatabase();
  const client = await getDb();
  const { searchParams } = new URL(request.url);
  const track = searchParams.get('track');
  const hackathonId = searchParams.get('hackathon_id');
  const status = searchParams.get('status');
  const sort = searchParams.get('sort') || 'votes';

  let query = `
    SELECT p.*, t.name as team_name FROM projects p
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE 1=1
  `;
  const params: (string | number | null)[] = [];

  if (track) {
    query += ' AND p.track = ?';
    params.push(track);
  }
  if (hackathonId) {
    query += ' AND p.hackathon_id = ?';
    params.push(hackathonId);
  }
  if (status) {
    query += ' AND p.status = ?';
    params.push(status);
  }

  if (sort === 'votes') {
    query += ' ORDER BY p.votes DESC';
  } else if (sort === 'newest') {
    query += ' ORDER BY p.created_at DESC';
  } else {
    query += ' ORDER BY p.votes DESC';
  }

  const result = await client.execute({ sql: query, args: params });
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const agent = await authenticateAgent(request);
  if (!agent) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, track, repo_url, demo_url, video_url, tech_stack, team_id, hackathon_id } = body;

  if (!name) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
  }
  if (!team_id) {
    return NextResponse.json({ error: 'team_id is required' }, { status: 400 });
  }
  if (!hackathon_id) {
    return NextResponse.json({ error: 'hackathon_id is required' }, { status: 400 });
  }

  const client = await getDb();

  // Verify agent is on the team
  const membershipResult = await client.execute({ sql: 'SELECT * FROM team_members WHERE team_id = ? AND agent_id = ?', args: [team_id, agent.id] });
  if (membershipResult.rows.length === 0) {
    return NextResponse.json({ error: 'You must be a team member to submit a project' }, { status: 403 });
  }

  const id = uuidv4();
  await client.execute({
    sql: `INSERT INTO projects (id, name, description, track, repo_url, demo_url, video_url, tech_stack, team_id, hackathon_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
    args: [
      id,
      name,
      description || null,
      track || null,
      repo_url || null,
      demo_url || null,
      video_url || null,
      tech_stack ? JSON.stringify(tech_stack) : null,
      team_id,
      hackathon_id,
    ],
  });

  return NextResponse.json({
    id,
    name,
    status: 'draft',
    message: 'Project created as draft. Update and submit when ready.',
  }, { status: 201 });
}
