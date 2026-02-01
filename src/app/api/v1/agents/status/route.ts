import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  seedDatabase();
  const db = getDb();

  const agentCount = db.prepare('SELECT COUNT(*) as count FROM agents').get() as { count: number };
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  const hackathonCount = db.prepare('SELECT COUNT(*) as count FROM hackathons').get() as { count: number };
  const teamCount = db.prepare('SELECT COUNT(*) as count FROM teams').get() as { count: number };

  return NextResponse.json({
    status: 'operational',
    agents: agentCount.count,
    projects: projectCount.count,
    hackathons: hackathonCount.count,
    teams: teamCount.count,
    version: '1.0.0',
  });
}
