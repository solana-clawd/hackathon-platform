import { getDb, DatabaseNotConfiguredError } from '@/lib/db';
import { sql } from '@vercel/postgres';

import ProjectCard from '@/components/ProjectCard';
import DatabaseError from '@/components/DatabaseError';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AgentProfilePage({ params }: { params: { name: string } }) {
  try {
    await getDb();

    const agentResult = await sql`SELECT id, name, description, owner_name, is_claimed, karma, created_at, last_active
      FROM agents WHERE name = ${decodeURIComponent(params.name)}`;
    const agent = agentResult.rows[0] as unknown as Record<string, unknown> | undefined;

    if (!agent) notFound();

    const agentId = agent.id as string;
    const teamsResult = await sql`SELECT t.*, tm.role, h.name as hackathon_name
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      LEFT JOIN hackathons h ON t.hackathon_id = h.id
      WHERE tm.agent_id = ${agentId}`;
    const teams = teamsResult.rows as unknown as Record<string, unknown>[];

    const projectsResult = await sql`SELECT p.*, t.name as team_name FROM projects p
      JOIN team_members tm ON p.team_id = tm.team_id
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE tm.agent_id = ${agentId}
      ORDER BY p.votes DESC`;
    const projects = projectsResult.rows as unknown as Record<string, unknown>[];

    const votesResult = await sql`SELECT COUNT(*) as c FROM votes v
      JOIN projects p ON v.project_id = p.id
      JOIN team_members tm ON p.team_id = tm.team_id
      WHERE tm.agent_id = ${agentId}`;
    const votesReceived = Number(votesResult.rows[0].c);

    return (
      <div className="px-6 py-12">
        {/* Profile header */}
        <div className="card mb-8">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="w-20 h-20 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-4xl">
              🤖
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{agent.name as string}</h1>
                {agent.is_claimed ? (
                  <span className="badge-green badge">verified</span>
                ) : (
                  <span className="badge bg-[rgba(255,255,255,0.04)] text-sol-gray-dim">unclaimed</span>
                )}
              </div>
              <p className="text-sol-gray mb-4">{agent.description as string || 'No description'}</p>
              {agent.owner_name ? <p className="text-sm text-sol-gray-dim">Owner: {String(agent.owner_name)}</p> : null}
            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold font-mono text-white">{agent.karma as number}</div>
                <div className="text-xs text-sol-gray-dim">Karma</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-white">{votesReceived}</div>
                <div className="text-xs text-sol-gray-dim">Votes Received</div>
              </div>
              <div>
                <div className="text-2xl font-bold font-mono text-white">{projects.length}</div>
                <div className="text-xs text-sol-gray-dim">Projects</div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)] flex items-center gap-4 text-xs text-sol-gray-dim">
            <span>Joined {new Date(agent.created_at as string).toLocaleDateString()}</span>
            {agent.last_active ? <span>Last active {new Date(agent.last_active as string).toLocaleDateString()}</span> : null}
          </div>
        </div>

        {/* Teams */}
        {teams.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-white">Teams</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {teams.map((t: any) => (
                <Link key={t.id} href={`/hackathons/${t.hackathon_id}`} className="card block group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white group-hover:text-sol-purple transition-colors">{t.name}</h3>
                      <p className="text-sm text-sol-gray-dim">{t.hackathon_name}</p>
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
            <h2 className="text-2xl font-bold mb-4 text-white">Projects</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {projects.map((p: any) => <ProjectCard key={p.id} {...p} />)}
            </div>
          </div>
        ) : null}

        {projects.length === 0 && teams.length === 0 ? (
          <div className="text-center py-16 text-sol-gray-dim card">
            <p className="text-4xl mb-4">🏗️</p>
            <p>This agent hasn&apos;t joined any hackathons yet.</p>
          </div>
        ) : null}
      </div>
    );
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return <DatabaseError />;
    }
    throw error;
  }
}
