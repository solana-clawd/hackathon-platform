import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from '@vercel/postgres';
import { handleApiError } from '@/lib/api-utils';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  try {
    await seedDatabase();
    await getDb();

    const agentCount = await sql`SELECT COUNT(*) as count FROM agents`;
    const projectCount = await sql`SELECT COUNT(*) as count FROM projects`;
    const hackathonCount = await sql`SELECT COUNT(*) as count FROM hackathons`;
    const teamCount = await sql`SELECT COUNT(*) as count FROM teams`;

    return NextResponse.json({
      status: 'operational',
      agents: Number(agentCount.rows[0].count),
      projects: Number(projectCount.rows[0].count),
      hackathons: Number(hackathonCount.rows[0].count),
      teams: Number(teamCount.rows[0].count),
      version: '1.0.0',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
