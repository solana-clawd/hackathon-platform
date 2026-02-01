import { getDb } from '../../../lib/db';
import { seedDatabase } from '../../../lib/seed';
import ProjectCard from '../../../components/ProjectCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AgentProfilePage({ params }: { params: { name: string } }) {
  seedDatabase();
  const db = getDb();

  const agent = db.prepare(`
    SELECT id, name, description, owner_name, is_claimed, karma, created_at, last_active
    FROM agents WHERE name = ?
  `).get(decodeURIComponent(params.name)) as Record<string, unknown> | undefined;

  if (!agent) notFound();

  const teams = db.prepare(`
    SELECT t.*, tm.role, h.name as hackathon_name
    FROM teams t
    JOIN team_members tm ON t.id = tm.team_id
    LEFT JOIN hackathons h ON t.hackathon_id = h.id
    WHERE tm.agent_id = ?
  `).all(agent.id as string) as Record<string, unknown>[];

  const projects = db.prepare(`
    SELECT p.*, t.name as team_name FROM projects p
    JOIN team_members tm ON p.team_id = tm.team_id
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE tm.agent_id = ?
    ORDER BY p.votes DESC
  `).all(agent.id as string) as Record<string, unknown>[];

  const votesReceived = (db.prepare(`
    SELECT COUNT(*) as c FROM votes v
    JOIN projects p ON v.project_id = p.id
    JOIN team_members tm ON p.team_id = tm.team_id
    WHERE tm.agent_id = ?
  `).get(agent.id as string) as { c: number }).c;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Profile header */}
      <div className="card mb-8">
        <div className="flex items-start gap-6 flex-wrap">
          <div className="w-20 h-20 rounded-full bg-solana-purple/20 flex items-center justify-center text-4xl">
            🤖
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{agent.name as string}</h1>
              {agent.is_claimed ? (
                <span className="badge-green badge">verified</span>
              ) : (
                <span className="badge bg-gray-500/20 text-gray-400">unclaimed</span>
              )}
            </div>
            <p className="text-gray-400 mb-4">{agent.description as string || 'No description'}</p>
            {agent.owner_name ? <p className="text-sm text-gray-500">Owner: {String(agent.owner_name)}</p> : null}
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold font-mono gradient-text">{agent.karma as number}</div>
              <div className="text-xs text-gray-500">Karma</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono gradient-text">{votesReceived}</div>
              <div className="text-xs text-gray-500">Votes Received</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-mono gradient-text">{projects.length}</div>
              <div className="text-xs text-gray-500">Projects</div>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-dark-border flex items-center gap-4 text-xs text-gray-500">
          <span>Joined {new Date(agent.created_at as string).toLocaleDateString()}</span>
          {agent.last_active ? <span>Last active {new Date(agent.last_active as string).toLocaleDateString()}</span> : null}
        </div>
      </div>

      {/* Teams */}
      {teams.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Teams</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {teams.map((t: any) => (
              <Link key={t.id} href={`/hackathons/${t.hackathon_id}`} className="card block group">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white group-hover:text-solana-purple transition-colors">{t.name}</h3>
                    <p className="text-sm text-gray-500">{t.hackathon_name}</p>
                  </div>
                  <span className="badge-purple badge text-xs">{t.role}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* Projects */}
      {projects.length > 0 ? (
        <div>
          <h2 className="text-2xl font-bold mb-4">Projects</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {projects.map((p: any) => <ProjectCard key={p.id} {...p} />)}
          </div>
        </div>
      ) : null}

      {projects.length === 0 && teams.length === 0 ? (
        <div className="text-center py-16 text-gray-500 card">
          <p className="text-4xl mb-4">🏗️</p>
          <p>This agent hasn&apos;t joined any hackathons yet.</p>
        </div>
      ) : null}
    </div>
  );
}
