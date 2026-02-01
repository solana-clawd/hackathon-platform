import { getDb, DatabaseNotConfiguredError } from '@/lib/db';
import { sql } from '@vercel/postgres';
import { seedDatabase } from '@/lib/seed';
import ProjectCard from '@/components/ProjectCard';
import DatabaseError from '@/components/DatabaseError';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage({ searchParams }: { searchParams: { track?: string; sort?: string } }) {
  try {
    await seedDatabase();
    await getDb();

    const tracks = ['DeFi', 'Infrastructure', 'Consumer', 'Gaming', 'DePIN', 'DAOs'];
    const activeTrack = searchParams.track || null;
    const sort = searchParams.sort || 'votes';

    let result;
    if (activeTrack) {
      result = sort === 'newest'
        ? await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id WHERE p.track = ${activeTrack} ORDER BY p.created_at DESC`
        : await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id WHERE p.track = ${activeTrack} ORDER BY p.votes DESC`;
    } else {
      result = sort === 'newest'
        ? await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id ORDER BY p.created_at DESC`
        : await sql`SELECT p.*, t.name as team_name FROM projects p LEFT JOIN teams t ON p.team_id = t.id ORDER BY p.votes DESC`;
    }
    const projects = result.rows as unknown as Record<string, unknown>[];

    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Projects</h1>
        <p className="text-sol-gray mb-8">Browse all hackathon submissions.</p>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <Link
            href="/projects"
            className={`badge text-sm ${!activeTrack ? 'bg-sol-purple/15 text-sol-purple' : 'bg-sol-dark-300 text-sol-gray-dim hover:text-white'} transition-colors`}
          >
            All
          </Link>
          {tracks.map((track) => (
            <Link
              key={track}
              href={`/projects?track=${track}${sort !== 'votes' ? `&sort=${sort}` : ''}`}
              className={`badge text-sm ${activeTrack === track ? 'bg-sol-purple/15 text-sol-purple' : 'bg-sol-dark-300 text-sol-gray-dim hover:text-white'} transition-colors`}
            >
              {track}
            </Link>
          ))}
          <span className="text-sol-dark-100 mx-2">|</span>
          <Link
            href={`/projects?${activeTrack ? `track=${activeTrack}&` : ''}sort=votes`}
            className={`text-sm ${sort === 'votes' ? 'text-sol-purple' : 'text-sol-gray-dim hover:text-white'}`}
          >
            Most Voted
          </Link>
          <Link
            href={`/projects?${activeTrack ? `track=${activeTrack}&` : ''}sort=newest`}
            className={`text-sm ${sort === 'newest' ? 'text-sol-purple' : 'text-sol-gray-dim hover:text-white'}`}
          >
            Newest
          </Link>
        </div>

        {projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p: any) => <ProjectCard key={p.id} {...p} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-sol-gray-dim">
            <p className="text-6xl mb-4">🔍</p>
            <p>No projects found{activeTrack ? ` in ${activeTrack}` : ''}.</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return <DatabaseError />;
    }
    return <DatabaseError title="Database Error" message={error instanceof Error ? error.message : 'An unexpected error occurred.'} />;
  }
}
