import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import ProjectCard from '@/components/ProjectCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HackathonDetailPage({ params }: { params: { id: string } }) {
  await seedDatabase();
  const client = await getDb();

  const hackathonResult = await client.execute({ sql: 'SELECT * FROM hackathons WHERE id = ?', args: [params.id] });
  const hackathon = hackathonResult.rows[0] as unknown as Record<string, unknown> | undefined;
  if (!hackathon) notFound();

  const tracks = hackathon.tracks ? JSON.parse(hackathon.tracks as string) : [];
  const prizes = hackathon.prizes ? JSON.parse(hackathon.prizes as string) : {};

  const projectsResult = await client.execute({
    sql: `SELECT p.*, t.name as team_name FROM projects p
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE p.hackathon_id = ?
    ORDER BY p.votes DESC`,
    args: [params.id],
  });
  const projects = projectsResult.rows as unknown as Record<string, unknown>[];

  const teamCountResult = await client.execute({ sql: 'SELECT COUNT(*) as c FROM teams WHERE hackathon_id = ?', args: [params.id] });
  const teamCount = teamCountResult.rows[0].c as number;

  const statusColors: Record<string, string> = {
    upcoming: 'badge-yellow',
    active: 'badge-green',
    judging: 'badge-purple',
    completed: 'bg-gray-500/20 text-gray-400',
  };

  const formatDate = (d: string | null) => d ? new Date(d as string).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <Link href="/hackathons" className="text-gray-500 hover:text-gray-300 text-sm mb-4 inline-block">← Back to Hackathons</Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{hackathon.name as string}</h1>
            <p className="text-gray-400 max-w-2xl">{hackathon.description as string}</p>
          </div>
          <span className={`badge uppercase tracking-wide ${statusColors[hackathon.status as string] || 'badge-purple'}`}>
            {hackathon.status as string}
          </span>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="card">
          <h3 className="text-sm text-gray-500 mb-2">Timeline</h3>
          <p className="font-mono text-sm">
            {formatDate(hackathon.start_date as string)} — {formatDate(hackathon.end_date as string)}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-500 mb-2">Participants</h3>
          <p className="font-mono text-2xl font-bold gradient-text">{teamCount} teams</p>
          <p className="text-sm text-gray-500">{projects.length} projects submitted</p>
        </div>
        <div className="card">
          <h3 className="text-sm text-gray-500 mb-2">Total Prizes</h3>
          <p className="font-mono text-2xl font-bold text-solana-green">
            {Object.values(prizes).length > 0 ? Object.values(prizes)[0] as string : 'TBD'}
          </p>
        </div>
      </div>

      {/* Tracks */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Tracks</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {tracks.map((track: string) => (
            <div key={track} className="card flex items-center justify-between">
              <span className="font-semibold">{track}</span>
              {prizes[track] ? <span className="font-mono text-solana-green text-sm">{prizes[track]}</span> : null}
            </div>
          ))}
        </div>
      </div>

      {/* Prizes */}
      {Object.keys(prizes).length > 0 ? (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Prizes</h2>
          <div className="card">
            <div className="space-y-3">
              {Object.entries(prizes).map(([name, amount]) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
                  <span className="font-medium">{name}</span>
                  <span className="font-mono text-solana-green font-bold">{amount as string}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Projects ({projects.length})</h2>
          <Link href={`/leaderboard?hackathon=${params.id}`} className="text-solana-purple hover:underline text-sm">
            View Leaderboard →
          </Link>
        </div>
        {projects.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {projects.map((p: any) => <ProjectCard key={p.id} {...p} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500 card">
            <p className="text-4xl mb-4">🏗️</p>
            <p>No projects submitted yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
}
