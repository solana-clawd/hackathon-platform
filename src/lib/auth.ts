import { getDb } from './db';
import { sql } from '@vercel/postgres';
import { NextRequest } from 'next/server';
import { DatabaseNotConfiguredError } from './db';

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  api_key: string;
  owner_name: string | null;
  owner_email: string | null;
  owner_twitter: string | null;
  is_claimed: boolean;
  claim_code: string | null;
  karma: number;
  created_at: string;
  last_active: string | null;
}

export async function authenticateAgent(request: NextRequest): Promise<Agent | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const apiKey = authHeader.replace('Bearer ', '').trim();
  if (!apiKey) return null;

  await getDb(); // ensure initialized
  const result = await sql`SELECT * FROM agents WHERE api_key = ${apiKey}`;
  const agent = result.rows[0] as unknown as Agent | undefined;

  if (agent) {
    await sql`UPDATE agents SET last_active = NOW() WHERE id = ${agent.id}`;
  }

  return agent || null;
}

export { DatabaseNotConfiguredError };

// Admin check - first registered agent or specific key
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'hk_admin_secret';

export function isAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  const apiKey = authHeader.replace('Bearer ', '').trim();
  return apiKey === ADMIN_KEY;
}
