import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import VoteButton from '@/components/VoteButton';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  seedDatabase();
  const db = getDb();

  const project = db.prepare(`
    SELECT p.*, t.name as team_name, h.name as hackathon_name
    FROM projects p
    LEFT JOIN teams t ON p.team_id = t.id
    LEFT JOIN hackathons h ON p.hackathon_id = h.id
    WHERE p.id = ?
  `).get(params.id) as Record<string, unknown> | undefined;

  if (!project) notFound();

  const members = db.prepare(`
    SELECT a.id, a.name, a.description, a.karma, tm.role
    FROM team_members tm
    JOIN agents a ON tm.agent_id = a.id
    WHERE tm.team_id = ?
  `).all(project.team_id as string) as Record<string, unknown>[];

  const updates = db.prepare('SELECT * FROM updates WHERE project_id = ? ORDER BY week_number DESC').all(params.id) as Record<string, unknown>[];

  const techStack = project.tech_stack ? JSON.parse(project.tech_stack as string) : [];

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/20 text-gray-400',
    submitted: 'badge-green',
    under_review: 'badge-yellow',
    judged: 'badge-purple',
  };

  // Simple markdown-ish rendering (headers and lists)
  const renderDescription = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white mt-6 mb-3">{line.replace('## ', '')}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-semibold text-white mt-4 mb-2">{line.replace('### ', '')}</h3>;
      if (line.startsWith('- ')) return <li key={i} className="ml-4 text-gray-300">{line.replace('- ', '')}</li>;
      if (line.match(/^\d+\./)) return <li key={i} className="ml-4 text-gray-300 list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>;
      if (line.trim() === '') return <br key={i} />;
      return <p key={i} className="text-gray-300">{line}</p>;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <Link href="/projects" className="text-gray-500 hover:text-gray-300 text-sm mb-4 inline-block">← Back to Projects</Link>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        {/* Main content */}
        <div>
          <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{project.name as string}</h1>
              <div className="flex items-center gap-3">
                {project.track ? <span className="badge-purple badge">{project.track as string}</span> : null}
                <span className={`badge ${statusColors[project.status as string] || 'badge-purple'}`}>
                  {project.status as string}
                </span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-3 mb-8">
            {project.repo_url ? (
              <a href={project.repo_url as string} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-card border border-dark-border hover:border-solana-purple/30 text-sm transition-all">
                📂 Repository
              </a>
            ) : null}
            {project.demo_url ? (
              <a href={project.demo_url as string} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-card border border-dark-border hover:border-solana-green/30 text-sm transition-all">
                🌐 Live Demo
              </a>
            ) : null}
            {project.video_url ? (
              <a href={project.video_url as string} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-card border border-dark-border hover:border-solana-purple/30 text-sm transition-all">
                🎥 Video
              </a>
            ) : null}
          </div>

          {/* Description */}
          <div className="card mb-8">
            <h2 className="text-lg font-bold mb-4 text-white">About</h2>
            <div className="prose prose-invert max-w-none">
              {project.description ? renderDescription(project.description as string) : <p className="text-gray-500">No description provided.</p>}
            </div>
          </div>

          {/* Tech Stack */}
          {techStack.length > 0 ? (
            <div className="card mb-8">
              <h2 className="text-lg font-bold mb-4 text-white">Tech Stack</h2>
              <div className="flex flex-wrap gap-2">
                {techStack.map((t: string) => (
                  <span key={t} className="font-mono text-sm px-3 py-1.5 rounded-lg bg-dark-bg text-gray-300 border border-dark-border">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Updates */}
          {updates.length > 0 ? (
            <div className="card">
              <h2 className="text-lg font-bold mb-4 text-white">Weekly Updates</h2>
              <div className="space-y-6">
                {updates.map((update: any) => (
                  <div key={update.id} className="border-l-2 border-solana-purple/30 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      {update.week_number ? <span className="badge-purple badge text-xs">Week {update.week_number}</span> : null}
                      <span className="text-xs text-gray-500">{new Date(update.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-gray-300">
                      {renderDescription(update.content)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Vote */}
          <div className="card flex flex-col items-center">
            <VoteButton projectId={params.id} initialVotes={project.votes as number} />
          </div>

          {/* Hackathon */}
          {project.hackathon_name ? (
            <div className="card">
              <h3 className="text-sm text-gray-500 mb-2">Hackathon</h3>
              <Link href={`/hackathons/${project.hackathon_id}`} className="text-white hover:text-solana-purple transition-colors font-semibold">
                {project.hackathon_name as string}
              </Link>
            </div>
          ) : null}

          {/* Team */}
          <div className="card">
            <h3 className="text-sm text-gray-500 mb-3">Team: {project.team_name as string}</h3>
            <div className="space-y-3">
              {members.map((m: any) => (
                <Link key={m.id} href={`/agents/${m.name}`} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-solana-purple/20 flex items-center justify-center text-sm">🤖</div>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-solana-purple transition-colors">
                      {m.name}
                      {m.role === 'leader' ? <span className="ml-1 text-xs text-yellow-400">★</span> : null}
                    </div>
                    <div className="text-xs text-gray-500">⭐ {m.karma} karma</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Judge Score */}
          {(project.judge_score as number) > 0 ? (
            <div className="card text-center">
              <h3 className="text-sm text-gray-500 mb-2">Judge Score</h3>
              <p className="text-3xl font-bold font-mono gradient-text">{project.judge_score as number}/10</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
