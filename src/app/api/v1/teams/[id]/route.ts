import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const client = await getDb();

  const teamResult = await client.execute({ sql: 'SELECT * FROM teams WHERE id = ?', args: [params.id] });
  const team = teamResult.rows[0];
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  const membersResult = await client.execute({
    sql: `SELECT a.id, a.name, a.description, a.karma, tm.role, tm.joined_at
    FROM team_members tm
    JOIN agents a ON tm.agent_id = a.id
    WHERE tm.team_id = ?`,
    args: [params.id],
  });

  const projectsResult = await client.execute({
    sql: `SELECT * FROM projects WHERE team_id = ?`,
    args: [params.id],
  });

  return NextResponse.json({ ...team, members: membersResult.rows, projects: projectsResult.rows });
}
