import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import ProjectCard from '@/components/ProjectCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function ProjectsPage({ searchParams }: { searchParams: { track?: string; sort?: string } }) {
  seedDatabase();
  const db = getDb();

  const tracks = ['DeFi', 'Infrastructure', 'Consumer', 'Gaming', 'DePIN', 'DAOs'];
  const activeTrack = searchParams.track || null;
  const sort = searchParams.sort || 'votes';

  let query = `
    SELECT p.*, t.name as team_name FROM projects p
    LEFT JOIN teams t ON p.team_id = t.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (activeTrack) {
    query += ' AND p.track = ?';
    params.push(activeTrack);
  }

  query += sort === 'newest' ? ' ORDER BY p.created_at DESC' : ' ORDER BY p.votes DESC';

  const projects = db.prepare(query).all(...params) as Record<string, unknown>[];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">Projects</h1>
      <p className="text-gray-400 mb-8">Browse all hackathon submissions.</p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <Link
          href="/projects"
          className={`badge text-sm ${!activeTrack ? 'bg-solana-purple/20 text-solana-purple' : 'bg-dark-card text-gray-400 hover:text-white'} transition-colors`}
        >
          All
        </Link>
        {tracks.map((track) => (
          <Link
            key={track}
            href={`/projects?track=${track}${sort !== 'votes' ? `&sort=${sort}` : ''}`}
            className={`badge text-sm ${activeTrack === track ? 'bg-solana-purple/20 text-solana-purple' : 'bg-dark-card text-gray-400 hover:text-white'} transition-colors`}
          >
            {track}
          </Link>
        ))}
        <span className="text-gray-600 mx-2">|</span>
        <Link
          href={`/projects?${activeTrack ? `track=${activeTrack}&` : ''}sort=votes`}
          className={`text-sm ${sort === 'votes' ? 'text-solana-purple' : 'text-gray-500 hover:text-white'}`}
        >
          Most Voted
        </Link>
        <Link
          href={`/projects?${activeTrack ? `track=${activeTrack}&` : ''}sort=newest`}
          className={`text-sm ${sort === 'newest' ? 'text-solana-purple' : 'text-gray-500 hover:text-white'}`}
        >
          Newest
        </Link>
      </div>

      {projects.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p: any) => <ProjectCard key={p.id} {...p} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <p className="text-6xl mb-4">🔍</p>
          <p>No projects found{activeTrack ? ` in ${activeTrack}` : ''}.</p>
        </div>
      )}
    </div>
  );
}
