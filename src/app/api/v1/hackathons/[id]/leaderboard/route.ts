import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  await seedDatabase();
  const client = await getDb();

  const { searchParams } = new URL(request.url);
  const track = searchParams.get('track');

  let query = `
    SELECT p.id, p.name, p.track, p.votes, p.judge_score, p.status,
      t.name as team_name,
      (p.votes + p.judge_score * 10) as total_score
    FROM projects p
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE p.hackathon_id = ? AND p.status IN ('submitted', 'under_review', 'judged')
  `;
  const queryParams: (string | number | null)[] = [params.id];

  if (track) {
    query += ' AND p.track = ?';
    queryParams.push(track);
  }

  query += ' ORDER BY total_score DESC, p.votes DESC';

  const result = await client.execute({ sql: query, args: queryParams });

  return NextResponse.json({
    hackathon_id: params.id,
    track: track || 'all',
    leaderboard: (result.rows as unknown as Record<string, unknown>[]).map((p, i) => ({
      rank: i + 1,
      ...p,
    })),
  });
}
