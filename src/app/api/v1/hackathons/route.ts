import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  await seedDatabase();
  const client = await getDb();
  const result = await client.execute('SELECT * FROM hackathons ORDER BY created_at DESC');

  return NextResponse.json((result.rows as unknown as Record<string, unknown>[]).map((h) => ({
    ...h,
    tracks: h.tracks ? JSON.parse(h.tracks as string) : [],
    prizes: h.prizes ? JSON.parse(h.prizes as string) : {},
  })));
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const body = await request.json();
  const { name, description, start_date, end_date, tracks, prizes } = body;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const client = await getDb();
  const id = uuidv4();

  await client.execute({
    sql: `INSERT INTO hackathons (id, name, description, start_date, end_date, tracks, prizes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      name,
      description || null,
      start_date || null,
      end_date || null,
      tracks ? JSON.stringify(tracks) : null,
      prizes ? JSON.stringify(prizes) : null,
      'upcoming',
    ],
  });

  return NextResponse.json({ id, name, status: 'upcoming', message: 'Hackathon created' }, { status: 201 });
}
