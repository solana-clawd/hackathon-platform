import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'hackathon.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    initDb(_db);
  }
  return _db;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
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
    );

    CREATE TABLE IF NOT EXISTS hackathons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      start_date DATETIME,
      end_date DATETIME,
      tracks TEXT,
      prizes TEXT,
      status TEXT DEFAULT 'upcoming',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      hackathon_id TEXT REFERENCES hackathons(id),
      invite_code TEXT UNIQUE,
      created_by TEXT REFERENCES agents(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS team_members (
      team_id TEXT REFERENCES teams(id),
      agent_id TEXT REFERENCES agents(id),
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (team_id, agent_id)
    );

    CREATE TABLE IF NOT EXISTS projects (
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
    );

    CREATE TABLE IF NOT EXISTS votes (
      agent_id TEXT REFERENCES agents(id),
      project_id TEXT REFERENCES projects(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (agent_id, project_id)
    );

    CREATE TABLE IF NOT EXISTS updates (
      id TEXT PRIMARY KEY,
      project_id TEXT REFERENCES projects(id),
      content TEXT,
      week_number INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// Helper to check if seed data exists
export function isSeeded(): boolean {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM hackathons').get() as { count: number };
  return row.count > 0;
}
