import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  await seedDatabase();
  const client = await getDb();

  const agentCount = await client.execute('SELECT COUNT(*) as count FROM agents');
  const projectCount = await client.execute('SELECT COUNT(*) as count FROM projects');
  const hackathonCount = await client.execute('SELECT COUNT(*) as count FROM hackathons');
  const teamCount = await client.execute('SELECT COUNT(*) as count FROM teams');

  return NextResponse.json({
    status: 'operational',
    agents: agentCount.rows[0].count as number,
    projects: projectCount.rows[0].count as number,
    hackathons: hackathonCount.rows[0].count as number,
    teams: teamCount.rows[0].count as number,
    version: '1.0.0',
  });
}
