import { getDb } from './db';
import { NextRequest } from 'next/server';

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  api_key: string;
  owner_name: string | null;
  owner_email: string | null;
  owner_twitter: string | null;
  is_claimed: number;
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

  const client = await getDb();
  const result = await client.execute({ sql: 'SELECT * FROM agents WHERE api_key = ?', args: [apiKey] });
  const agent = result.rows[0] as unknown as Agent | undefined;

  if (agent) {
    await client.execute({ sql: 'UPDATE agents SET last_active = CURRENT_TIMESTAMP WHERE id = ?', args: [agent.id] });
  }

  return agent || null;
}

// Admin check - first registered agent or specific key
const ADMIN_KEY = process.env.ADMIN_API_KEY || 'hk_admin_secret';

export function isAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;
  const apiKey = authHeader.replace('Bearer ', '').trim();
  return apiKey === ADMIN_KEY;
}
