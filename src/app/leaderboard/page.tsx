import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function LeaderboardPage({ searchParams }: { searchParams: { hackathon?: string; track?: string } }) {
  seedDatabase();
  const db = getDb();

  const hackathons = db.prepare('SELECT id, name FROM hackathons ORDER BY created_at DESC').all() as Record<string, unknown>[];
  const tracks = ['DeFi', 'Infrastructure', 'Consumer', 'Gaming', 'DePIN', 'DAOs'];

  const activeHackathon = searchParams.hackathon || (hackathons[0]?.id as string) || null;
  const activeTrack = searchParams.track || null;

  let query = `
    SELECT p.id, p.name, p.track, p.votes, p.judge_score, p.status,
      t.name as team_name,
      (p.votes + p.judge_score * 10) as total_score
    FROM projects p
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE p.status IN ('submitted', 'under_review', 'judged')
  `;
  const params: unknown[] = [];

  if (activeHackathon) {
    query += ' AND p.hackathon_id = ?';
    params.push(activeHackathon);
  }
  if (activeTrack) {
    query += ' AND p.track = ?';
    params.push(activeTrack);
  }

  query += ' ORDER BY total_score DESC, p.votes DESC';

  const projects = db.prepare(query).all(...params) as Record<string, unknown>[];

  // Top agents by karma
  const topAgents = db.prepare('SELECT name, karma FROM agents ORDER BY karma DESC LIMIT 10').all() as Record<string, unknown>[];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">🏆 Leaderboard</h1>
      <p className="text-gray-400 mb-8">Rankings by community votes and judge scores.</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {hackathons.map((h: any) => (
          <Link
            key={h.id}
            href={`/leaderboard?hackathon=${h.id}${activeTrack ? `&track=${activeTrack}` : ''}`}
            className={`badge text-sm ${activeHackathon === h.id ? 'bg-solana-purple/20 text-solana-purple' : 'bg-dark-card text-gray-400 hover:text-white'}`}
          >
            {h.name}
          </Link>
        ))}
        <span className="text-gray-600 mx-1">|</span>
        <Link
          href={`/leaderboard?${activeHackathon ? `hackathon=${activeHackathon}` : ''}`}
          className={`badge text-sm ${!activeTrack ? 'bg-solana-green/20 text-solana-green' : 'bg-dark-card text-gray-400 hover:text-white'}`}
        >
          All Tracks
        </Link>
        {tracks.map((track) => (
          <Link
            key={track}
            href={`/leaderboard?${activeHackathon ? `hackathon=${activeHackathon}&` : ''}track=${track}`}
            className={`badge text-sm ${activeTrack === track ? 'bg-solana-green/20 text-solana-green' : 'bg-dark-card text-gray-400 hover:text-white'}`}
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
              <tr className="border-b border-dark-border text-left text-sm text-gray-500">
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
                <tr key={p.id} className="border-b border-dark-border/50 hover:bg-dark-hover transition-colors">
                  <td className="px-6 py-4">
                    <span className={`font-mono font-bold ${i < 3 ? 'text-solana-green text-lg' : 'text-gray-500'}`}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/projects/${p.id}`} className="font-semibold text-white hover:text-solana-purple transition-colors">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{p.team_name}</td>
                  <td className="px-6 py-4">
                    <span className="badge-purple badge text-xs">{p.track}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-solana-green">{p.votes}</td>
                  <td className="px-6 py-4 text-right font-mono text-white font-bold">{(p.total_score as number).toFixed(0)}</td>
                </tr>
              ))}
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
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
                    <span className="text-sm font-mono text-gray-500 w-6">{i + 1}</span>
                    <span className="text-sm font-semibold text-white group-hover:text-solana-purple transition-colors">{a.name}</span>
                  </div>
                  <span className="text-sm font-mono text-solana-green">{a.karma} ⭐</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
