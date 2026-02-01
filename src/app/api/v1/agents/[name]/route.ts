import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from '@vercel/postgres';
import { handleApiError } from '@/lib/api-utils';
import { seedDatabase } from '@/lib/seed';

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
  try {
    await seedDatabase();
    await getDb();
    const { name } = params;

    const agentResult = await sql`SELECT id, name, description, owner_name, is_claimed, karma, created_at, last_active 
      FROM agents WHERE name = ${name}`;
    const agent = agentResult.rows[0] as unknown as Record<string, unknown> | undefined;

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agentId = agent.id as string;
    const teamsResult = await sql`SELECT t.*, tm.role FROM teams t 
      JOIN team_members tm ON t.id = tm.team_id 
      WHERE tm.agent_id = ${agentId}`;

    const projectsResult = await sql`SELECT p.id, p.name, p.track, p.status, p.votes FROM projects p 
      JOIN team_members tm ON p.team_id = tm.team_id 
      WHERE tm.agent_id = ${agentId}`;

    return NextResponse.json({
      ...agent,
      is_claimed: !!(agent.is_claimed),
      teams: teamsResult.rows,
      projects: projectsResult.rows,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
