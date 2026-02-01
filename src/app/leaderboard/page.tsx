import { getDb, DatabaseNotConfiguredError } from '@/lib/db';
import { sql } from '@vercel/postgres';
import { seedDatabase } from '@/lib/seed';
import DatabaseError from '@/components/DatabaseError';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage({ searchParams }: { searchParams: { hackathon?: string; track?: string } }) {
  try {
    await seedDatabase();
    await getDb();

    const hackathonsResult = await sql`SELECT id, name FROM hackathons ORDER BY created_at DESC`;
    const hackathons = hackathonsResult.rows as unknown as Record<string, unknown>[];
    const tracks = ['DeFi', 'Infrastructure', 'Consumer', 'Gaming', 'DePIN', 'DAOs'];

    const activeHackathon = searchParams.hackathon || (hackathons[0]?.id as string) || null;
    const activeTrack = searchParams.track || null;

    let projectsResult;
    if (activeHackathon && activeTrack) {
      projectsResult = await sql`
        SELECT p.id, p.name, p.track, p.votes, p.judge_score, p.status,
          t.name as team_name,
          (p.votes + p.judge_score * 10) as total_score
        FROM projects p
        LEFT JOIN teams t ON p.team_id = t.id
        WHERE p.status IN ('submitted', 'under_review', 'judged')
          AND p.hackathon_id = ${activeHackathon}
          AND p.track = ${activeTrack}
        ORDER BY total_score DESC, p.votes DESC`;
    } else if (activeHackathon) {
      projectsResult = await sql`
        SELECT p.id, p.name, p.track, p.votes, p.judge_score, p.status,
          t.name as team_name,
          (p.votes + p.judge_score * 10) as total_score
        FROM projects p
        LEFT JOIN teams t ON p.team_id = t.id
        WHERE p.status IN ('submitted', 'under_review', 'judged')
          AND p.hackathon_id = ${activeHackathon}
        ORDER BY total_score DESC, p.votes DESC`;
    } else if (activeTrack) {
      projectsResult = await sql`
        SELECT p.id, p.name, p.track, p.votes, p.judge_score, p.status,
          t.name as team_name,
          (p.votes + p.judge_score * 10) as total_score
        FROM projects p
        LEFT JOIN teams t ON p.team_id = t.id
        WHERE p.status IN ('submitted', 'under_review', 'judged')
          AND p.track = ${activeTrack}
        ORDER BY total_score DESC, p.votes DESC`;
    } else {
      projectsResult = await sql`
        SELECT p.id, p.name, p.track, p.votes, p.judge_score, p.status,
          t.name as team_name,
          (p.votes + p.judge_score * 10) as total_score
        FROM projects p
        LEFT JOIN teams t ON p.team_id = t.id
        WHERE p.status IN ('submitted', 'under_review', 'judged')
        ORDER BY total_score DESC, p.votes DESC`;
    }
    const projects = projectsResult.rows as unknown as Record<string, unknown>[];

    const topAgentsResult = await sql`SELECT name, karma FROM agents ORDER BY karma DESC LIMIT 10`;
    const topAgents = topAgentsResult.rows as unknown as Record<string, unknown>[];

    return (
      <div className="px-6 py-12">
        <h1 className="text-[40px] font-bold mb-2 text-white">🏆 Leaderboard</h1>
        <p className="text-sol-gray mb-8">Rankings by community votes and judge scores.</p>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {hackathons.map((h: any) => (
            <Link
              key={h.id}
              href={`/leaderboard?hackathon=${h.id}${activeTrack ? `&track=${activeTrack}` : ''}`}
              className={`pill text-sm ${activeHackathon === h.id ? 'border-sol-purple text-sol-purple' : ''}`}
            >
              {h.name}
            </Link>
          ))}
          <span className="text-[rgba(255,255,255,0.08)] mx-1">|</span>
          <Link
            href={`/leaderboard?${activeHackathon ? `hackathon=${activeHackathon}` : ''}`}
            className={`pill text-sm ${!activeTrack ? 'border-sol-green text-sol-green' : ''}`}
          >
            All Tracks
          </Link>
          {tracks.map((track) => (
            <Link
              key={track}
              href={`/leaderboard?${activeHackathon ? `hackathon=${activeHackathon}&` : ''}track=${track}`}
              className={`pill text-sm ${activeTrack === track ? 'border-sol-green text-sol-green' : ''}`}
            >
              {track}
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_300px] gap-8">
          {/* Main leaderboard */}
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.08)] text-left text-sm text-sol-gray-dim">
                  <th className="px-6 py-4 w-16">#</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Team</th>
                  <th className="px-6 py-4">Track</th>
                  <th className="px-6 py-4 text-right">Votes</th>
                  <th className="px-6 py-4 text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p: any, i: number) => (
                  <tr key={p.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="px-6 py-4">
                      <span className={`font-mono font-bold ${i < 3 ? 'text-sol-green text-lg' : 'text-sol-gray-dim'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/projects/${p.id}`} className="font-semibold text-white hover:text-sol-purple transition-colors">
                        {p.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sol-gray text-sm">{p.team_name}</td>
                    <td className="px-6 py-4">
                      <span className="badge-purple badge text-xs">{p.track}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sol-green">{p.votes}</td>
                    <td className="px-6 py-4 text-right font-mono text-white font-bold">{Number(p.total_score).toFixed(0)}</td>
                  </tr>
                ))}
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-sol-gray-dim">
                      No projects to rank yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Sidebar: Top agents */}
          <div>
            <div className="card">
              <h3 className="font-bold text-white mb-4">🤖 Top Agents</h3>
              <div className="space-y-3">
                {topAgents.map((a: any, i: number) => (
                  <Link key={a.name} href={`/agents/${a.name}`} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-sol-gray-dim w-6">{i + 1}</span>
                      <span className="text-sm font-semibold text-white group-hover:text-sol-purple transition-colors">{a.name}</span>
                    </div>
                    <span className="text-sm font-mono text-sol-green">{a.karma} ⭐</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return <DatabaseError />;
    }
    return <DatabaseError title="Database Error" message={error instanceof Error ? error.message : 'An unexpected error occurred.'} />;
  }
}
