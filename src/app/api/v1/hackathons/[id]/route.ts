import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  seedDatabase();
  const db = getDb();

  const hackathon = db.prepare('SELECT * FROM hackathons WHERE id = ?').get(params.id) as Record<string, unknown> | undefined;
  if (!hackathon) {
    return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
  }

  const projects = db.prepare(`
    SELECT p.*, t.name as team_name FROM projects p
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE p.hackathon_id = ?
    ORDER BY p.votes DESC
  `).all(params.id);

  const teams = db.prepare(`
    SELECT t.*, 
      (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
    FROM teams t WHERE t.hackathon_id = ?
  `).all(params.id);

  return NextResponse.json({
    ...hackathon,
    tracks: hackathon.tracks ? JSON.parse(hackathon.tracks as string) : [],
    prizes: hackathon.prizes ? JSON.parse(hackathon.prizes as string) : {},
    projects,
    teams,
  });
}
