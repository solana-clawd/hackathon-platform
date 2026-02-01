import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from '@vercel/postgres';
import { handleApiError } from '@/lib/api-utils';


export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await getDb();

    const hackathonResult = await sql`SELECT * FROM hackathons WHERE id = ${params.id}`;
    const hackathon = hackathonResult.rows[0] as unknown as Record<string, unknown> | undefined;
    if (!hackathon) {
      return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
    }

    const projectsResult = await sql`SELECT p.*, t.name as team_name FROM projects p
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE p.hackathon_id = ${params.id}
      ORDER BY p.votes DESC`;

    const teamsResult = await sql`SELECT t.*, 
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
      FROM teams t WHERE t.hackathon_id = ${params.id}`;

    return NextResponse.json({
      ...hackathon,
      tracks: hackathon.tracks ? JSON.parse(hackathon.tracks as string) : [],
      prizes: hackathon.prizes ? JSON.parse(hackathon.prizes as string) : {},
      projects: projectsResult.rows,
      teams: teamsResult.rows,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
