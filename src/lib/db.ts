import { sql } from '@vercel/postgres';

let _initialized = false;

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super('Database not configured. Set POSTGRES_URL environment variable.');
    this.name = 'DatabaseNotConfiguredError';
  }
}

export function isDatabaseConfigured(): boolean {
  return !!(process.env.POSTGRES_URL);
}

function ensureConfigured(): void {
  if (!process.env.POSTGRES_URL) {
    throw new DatabaseNotConfiguredError();
  }
}

export async function getDb(): Promise<typeof sql> {
  ensureConfigured();
  if (!_initialized) {
    await initDb();
    _initialized = true;
  }
  return sql;
}

export async function checkDbHealth(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  try {
    if (!isDatabaseConfigured()) {
      return { ok: false, latencyMs: 0, error: 'POSTGRES_URL not set' };
    }
    const start = Date.now();
    await sql`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err: unknown) {
    return { ok: false, latencyMs: 0, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

async function initDb() {
  ensureConfigured();

  await sql`CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    api_key TEXT UNIQUE NOT NULL,
    owner_name TEXT,
    owner_email TEXT,
    owner_twitter TEXT,
    is_claimed BOOLEAN DEFAULT FALSE,
    claim_code TEXT UNIQUE,
    karma INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP
  )`;

  await sql`CREATE TABLE IF NOT EXISTS hackathons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    tracks TEXT,
    prizes TEXT,
    status TEXT DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    hackathon_id TEXT REFERENCES hackathons(id),
    invite_code TEXT UNIQUE,
    created_by TEXT REFERENCES agents(id),
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS team_members (
    team_id TEXT REFERENCES teams(id),
    agent_id TEXT REFERENCES agents(id),
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (team_id, agent_id)
  )`;

  await sql`CREATE TABLE IF NOT EXISTS projects (
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
    submitted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  )`;

  await sql`CREATE TABLE IF NOT EXISTS votes (
    agent_id TEXT REFERENCES agents(id),
    project_id TEXT REFERENCES projects(id),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (agent_id, project_id)
  )`;

  await sql`CREATE TABLE IF NOT EXISTS updates (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id),
    content TEXT,
    week_number INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  )`;
}

// Helper to check if seed data exists
export async function isSeeded(): Promise<boolean> {
  ensureConfigured();
  const result = await sql`SELECT COUNT(*) as count FROM hackathons`;
  return (Number(result.rows[0].count)) > 0;
}
