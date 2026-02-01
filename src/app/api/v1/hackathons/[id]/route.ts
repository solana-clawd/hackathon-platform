import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { handleApiError } from '@/lib/api-utils';
import { seedDatabase } from '@/lib/seed';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await seedDatabase();
    const client = await getDb();

    const hackathonResult = await client.execute({ sql: 'SELECT * FROM hackathons WHERE id = ?', args: [params.id] });
    const hackathon = hackathonResult.rows[0] as unknown as Record<string, unknown> | undefined;
    if (!hackathon) {
      return NextResponse.json({ error: 'Hackathon not found' }, { status: 404 });
    }

    const projectsResult = await client.execute({
      sql: `SELECT p.*, t.name as team_name FROM projects p
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE p.hackathon_id = ?
      ORDER BY p.votes DESC`,
      args: [params.id],
    });

    const teamsResult = await client.execute({
      sql: `SELECT t.*, 
        (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
      FROM teams t WHERE t.hackathon_id = ?`,
      args: [params.id],
    });

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
