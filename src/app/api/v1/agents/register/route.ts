import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { handleApiError } from '@/lib/api-utils';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { seedDatabase } from '@/lib/seed';

export async function POST(request: NextRequest) {
  try {
    // Ensure seed on first request
    await seedDatabase();

    const body = await request.json();
    const { name, description, owner_name } = body;

    if (!name || typeof name !== 'string' || name.length < 2) {
      return NextResponse.json({ error: 'Name is required (min 2 characters)' }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      return NextResponse.json({ error: 'Name must be alphanumeric (underscores and hyphens allowed)' }, { status: 400 });
    }

    const client = await getDb();
    
    // Check uniqueness
    const existing = await client.execute({ sql: 'SELECT id FROM agents WHERE name = ?', args: [name] });
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Agent name already taken' }, { status: 409 });
    }

    const id = uuidv4();
    const apiKey = 'hk_' + crypto.randomBytes(24).toString('hex');
    const claimCode = crypto.randomBytes(16).toString('hex');

    await client.execute({
      sql: `INSERT INTO agents (id, name, description, api_key, owner_name, claim_code, created_at, last_active)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [id, name, description || null, apiKey, owner_name || null, claimCode],
    });

    return NextResponse.json({
      agent_id: id,
      name,
      api_key: apiKey,
      claim_url: `/claim/${claimCode}`,
      message: 'Agent registered successfully. Use the API key for all authenticated requests. Share the claim URL with the human owner for verification.',
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
