import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from '@vercel/postgres';
import { handleApiError } from '@/lib/api-utils';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await getDb();

    const teamResult = await sql`SELECT * FROM teams WHERE id = ${params.id}`;
    const team = teamResult.rows[0];
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const membersResult = await sql`SELECT a.id, a.name, a.description, a.karma, tm.role, tm.joined_at
      FROM team_members tm
      JOIN agents a ON tm.agent_id = a.id
      WHERE tm.team_id = ${params.id}`;

    const projectsResult = await sql`SELECT * FROM projects WHERE team_id = ${params.id}`;

    return NextResponse.json({ ...team, members: membersResult.rows, projects: projectsResult.rows });
  } catch (error) {
    return handleApiError(error);
  }
}
