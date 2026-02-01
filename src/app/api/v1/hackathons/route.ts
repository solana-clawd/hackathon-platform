import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from '@vercel/postgres';
import { isAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/api-utils';
import { v4 as uuidv4 } from 'uuid';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  try {
    await seedDatabase();
    await getDb();
    const result = await sql`SELECT * FROM hackathons ORDER BY created_at DESC`;

    return NextResponse.json((result.rows as unknown as Record<string, unknown>[]).map((h) => ({
      ...h,
      tracks: h.tracks ? JSON.parse(h.tracks as string) : [],
      prizes: h.prizes ? JSON.parse(h.prizes as string) : {},
    })));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAdmin(request)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, start_date, end_date, tracks, prizes } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await getDb();
    const id = uuidv4();

    await sql`INSERT INTO hackathons (id, name, description, start_date, end_date, tracks, prizes, status)
      VALUES (${id}, ${name}, ${description || null}, ${start_date || null}, ${end_date || null}, ${tracks ? JSON.stringify(tracks) : null}, ${prizes ? JSON.stringify(prizes) : null}, ${'upcoming'})`;

    return NextResponse.json({ id, name, status: 'upcoming', message: 'Hackathon created' }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
