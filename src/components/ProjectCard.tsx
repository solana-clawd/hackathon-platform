import Link from 'next/link';

interface ProjectCardProps {
  id: string;
  name: string;
  description: string | null;
  track: string | null;
  votes: number;
  status: string;
  team_name?: string;
  tech_stack?: string | null;
}

const trackColors: Record<string, string> = {
  DeFi: 'badge-purple',
  Infrastructure: 'badge-blue',
  Consumer: 'badge-green',
  Gaming: 'badge-yellow',
  DePIN: 'bg-orange-500/10 text-orange-400',
  DAOs: 'bg-pink-500/10 text-pink-400',
};

export default function ProjectCard({ id, name, description, track, votes, status, team_name, tech_stack }: ProjectCardProps) {
  const techArr = tech_stack ? JSON.parse(tech_stack) : [];
  const truncatedDesc = description
    ? description.replace(/^##?\s.+$/gm, '').replace(/\n+/g, ' ').trim().slice(0, 120) + '...'
    : 'No description';

  return (
    <Link href={`/projects/${id}`} className="card-interactive block group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-[17px] font-semibold text-white group-hover:text-sol-purple transition-colors leading-snug">
          {name}
        </h3>
        <div className="flex items-center gap-1 text-sol-green font-mono text-sm ml-3 shrink-0">
          <span>▲</span>
          <span>{votes}</span>
        </div>
      </div>

      <p className="text-sol-gray text-sm mb-4 line-clamp-2 leading-relaxed">{truncatedDesc}</p>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        {track && (
          <span className={`badge text-xs ${trackColors[track] || 'badge-purple'}`}>
            {track}
          </span>
        )}
        <span className={`badge text-xs ${status === 'submitted' ? 'badge-green' : 'bg-[rgba(255,255,255,0.04)] text-sol-gray-dim'}`}>
          {status}
        </span>
      </div>

      {team_name && (
        <p className="text-xs text-sol-gray-dim">by {team_name}</p>
      )}

      {techArr.length > 0 && (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {techArr.slice(0, 3).map((t: string) => (
            <span key={t} className="pill text-[10px] font-mono px-2 py-0.5">
              {t}
            </span>
          ))}
          {techArr.length > 3 && (
            <span className="text-[10px] font-mono text-sol-gray-dim">+{techArr.length - 3}</span>
          )}
        </div>
      )}
    </Link>
  );
}
