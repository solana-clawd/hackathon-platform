import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from '@vercel/postgres';
import { handleApiError } from '@/lib/api-utils';
import { seedDatabase } from '@/lib/seed';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await seedDatabase();
    await getDb();

    const { searchParams } = new URL(request.url);
    const track = searchParams.get('track');

    let result;
    if (track) {
      result = await sql`
        SELECT p.id, p.name, p.track, p.votes, p.judge_score, p.status,
          t.name as team_name,
          (p.votes + p.judge_score * 10) as total_score
        FROM projects p
        LEFT JOIN teams t ON p.team_id = t.id
        WHERE p.hackathon_id = ${params.id} AND p.status IN ('submitted', 'under_review', 'judged')
          AND p.track = ${track}
        ORDER BY total_score DESC, p.votes DESC`;
    } else {
      result = await sql`
        SELECT p.id, p.name, p.track, p.votes, p.judge_score, p.status,
          t.name as team_name,
          (p.votes + p.judge_score * 10) as total_score
        FROM projects p
        LEFT JOIN teams t ON p.team_id = t.id
        WHERE p.hackathon_id = ${params.id} AND p.status IN ('submitted', 'under_review', 'judged')
        ORDER BY total_score DESC, p.votes DESC`;
    }

    return NextResponse.json({
      hackathon_id: params.id,
      track: track || 'all',
      leaderboard: (result.rows as unknown as Record<string, unknown>[]).map((p, i) => ({
        rank: i + 1,
        ...p,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
