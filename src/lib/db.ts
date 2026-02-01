import { createClient, Client } from '@libsql/client';

let _client: Client | null = null;
let _initialized = false;

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super('Database not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.');
    this.name = 'DatabaseNotConfiguredError';
  }
}

export function isDatabaseConfigured(): boolean {
  return !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
}

export function getClient(): Client {
  if (!_client) {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
      throw new DatabaseNotConfiguredError();
    }
    _client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _client;
}

export async function getDb(): Promise<Client> {
  const client = getClient();
  if (!_initialized) {
    await initDb(client);
    _initialized = true;
  }
  return client;
}

export async function checkDbHealth(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  try {
    if (!isDatabaseConfigured()) {
      return { ok: false, latencyMs: 0, error: 'TURSO_DATABASE_URL and TURSO_AUTH_TOKEN not set' };
    }
    const start = Date.now();
    const client = await getDb();
    await client.execute('SELECT 1');
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err: unknown) {
    return { ok: false, latencyMs: 0, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

async function initDb(client: Client) {
  await client.batch([
    `CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      api_key TEXT UNIQUE NOT NULL,
      owner_name TEXT,
      owner_email TEXT,
      owner_twitter TEXT,
      is_claimed INTEGER DEFAULT 0,
      claim_code TEXT UNIQUE,
      karma INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME
    )`,
    `CREATE TABLE IF NOT EXISTS hackathons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      start_date DATETIME,
      end_date DATETIME,
      tracks TEXT,
      prizes TEXT,
      status TEXT DEFAULT 'upcoming',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      hackathon_id TEXT REFERENCES hackathons(id),
      invite_code TEXT UNIQUE,
      created_by TEXT REFERENCES agents(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS team_members (
      team_id TEXT REFERENCES teams(id),
      agent_id TEXT REFERENCES agents(id),
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (team_id, agent_id)
    )`,
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      track TEXT,
      repo_url TEXT,
      demo_url TEXT,
      video_url TEXT,
      tech_stack TEXT,
      team_id TEXT REFERENCES teams(id),
      hackathon_id TEXT REFERENCES hackathons(id),
      status TEXT DEFAULT 'draft',
      votes INTEGER DEFAULT 0,
      judge_score REAL DEFAULT 0,
      submitted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS votes (
      agent_id TEXT REFERENCES agents(id),
      project_id TEXT REFERENCES projects(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (agent_id, project_id)
    )`,
    `CREATE TABLE IF NOT EXISTS updates (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id),
      content TEXT,
      week_number INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
  ], 'write');
}

// Helper to check if seed data exists
export async function isSeeded(): Promise<boolean> {
  const client = await getDb();
  const result = await client.execute('SELECT COUNT(*) as count FROM hackathons');
  return (result.rows[0].count as number) > 0;
}
