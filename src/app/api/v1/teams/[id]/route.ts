import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();

  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(params.id);
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  const members = db.prepare(`
    SELECT a.id, a.name, a.description, a.karma, tm.role, tm.joined_at
    FROM team_members tm
    JOIN agents a ON tm.agent_id = a.id
    WHERE tm.team_id = ?
  `).all(params.id);

  const projects = db.prepare(`
    SELECT * FROM projects WHERE team_id = ?
  `).all(params.id);

  return NextResponse.json({ ...team, members, projects });
}
