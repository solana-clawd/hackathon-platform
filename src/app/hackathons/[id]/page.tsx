import { getDb, DatabaseNotConfiguredError } from '@/lib/db';
import { sql } from '@vercel/postgres';

import ProjectCard from '@/components/ProjectCard';
import DatabaseError from '@/components/DatabaseError';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HackathonDetailPage({ params }: { params: { id: string } }) {
  try {
    await getDb();

    const hackathonResult = await sql`SELECT * FROM hackathons WHERE id = ${params.id}`;
    const hackathon = hackathonResult.rows[0] as unknown as Record<string, unknown> | undefined;
    if (!hackathon) notFound();

    const tracks = hackathon.tracks ? JSON.parse(hackathon.tracks as string) : [];
    const prizes = hackathon.prizes ? JSON.parse(hackathon.prizes as string) : {};

    const projectsResult = await sql`SELECT p.*, t.name as team_name FROM projects p
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE p.hackathon_id = ${params.id}
      ORDER BY p.votes DESC`;
    const projects = projectsResult.rows as unknown as Record<string, unknown>[];

    const teamCountResult = await sql`SELECT COUNT(*) as c FROM teams WHERE hackathon_id = ${params.id}`;
    const teamCount = Number(teamCountResult.rows[0].c);

    const statusColors: Record<string, string> = {
      upcoming: 'badge-yellow',
      active: 'badge-green',
      judging: 'badge-purple',
      completed: 'bg-[rgba(255,255,255,0.04)] text-sol-gray-dim',
    };

    const formatDate = (d: string | null) => d ? new Date(d as string).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

    return (
      <div className="px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link href="/hackathons" className="text-sol-gray-dim hover:text-white text-sm mb-4 inline-block transition-colors">← Back to Hackathons</Link>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-[40px] font-bold mb-2 text-white">{hackathon.name as string}</h1>
              <p className="text-sol-gray max-w-2xl">{hackathon.description as string}</p>
            </div>
            <span className={`badge uppercase tracking-wide ${statusColors[hackathon.status as string] || 'badge-purple'}`}>
              {hackathon.status as string}
            </span>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="card">
            <h3 className="text-sm text-sol-gray-dim mb-2">Timeline</h3>
            <p className="font-mono text-sm text-white">
              {formatDate(hackathon.start_date as string)} — {formatDate(hackathon.end_date as string)}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm text-sol-gray-dim mb-2">Participants</h3>
            <p className="font-mono text-2xl font-bold text-white">{teamCount} teams</p>
            <p className="text-sm text-sol-gray-dim">{projects.length} projects submitted</p>
          </div>
          <div className="card">
            <h3 className="text-sm text-sol-gray-dim mb-2">Total Prizes</h3>
            <p className="font-mono text-2xl font-bold text-sol-green">
              {Object.values(prizes).length > 0 ? Object.values(prizes)[0] as string : 'TBD'}
            </p>
          </div>
        </div>

        {/* Tracks */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-white">Tracks</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {tracks.map((track: string) => (
              <div key={track} className="card flex items-center justify-between">
                <span className="font-semibold text-white">{track}</span>
                {prizes[track] ? <span className="font-mono text-sol-green text-sm">{prizes[track]}</span> : null}
              </div>
            ))}
          </div>
        </div>

        {/* Prizes */}
        {Object.keys(prizes).length > 0 ? (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-white">Prizes</h2>
            <div className="card">
              <div className="space-y-3">
                {Object.entries(prizes).map(([name, amount]) => (
                  <div key={name} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.08)] last:border-0">
                    <span className="font-medium text-white">{name}</span>
                    <span className="font-mono text-sol-green font-bold">{amount as string}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {/* Projects */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Projects ({projects.length})</h2>
            <Link href={`/leaderboard?hackathon=${params.id}`} className="pill">
              View Leaderboard →
            </Link>
          </div>
          {projects.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {projects.map((p: any) => <ProjectCard key={p.id} {...p} />)}
            </div>
          ) : (
            <div className="text-center py-16 text-sol-gray-dim card">
              <p className="text-4xl mb-4">🏗️</p>
              <p>No projects submitted yet. Be the first!</p>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return <DatabaseError />;
    }
    throw error;
  }
}
