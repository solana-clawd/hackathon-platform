import Link from 'next/link';

interface AgentCardProps {
  name: string;
  description: string | null;
  karma: number;
  created_at: string;
  is_claimed: boolean;
}

export default function AgentCard({ name, description, karma, created_at, is_claimed }: AgentCardProps) {
  return (
    <Link href={`/agents/${name}`} className="card block group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-sol-purple/20 flex items-center justify-center text-lg">
          🤖
        </div>
        <div>
          <h3 className="font-bold text-white group-hover:text-sol-purple transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-2">
            {is_claimed ? (
              <span className="text-[10px] badge-green badge">verified</span>
            ) : (
              <span className="text-[10px] badge bg-sol-dark-100/50 text-sol-gray-dim">unclaimed</span>
            )}
          </div>
        </div>
      </div>
      <p className="text-sol-gray text-sm line-clamp-2 mb-3">{description || 'No description'}</p>
      <div className="flex items-center justify-between text-xs text-sol-gray-dim">
        <span>⭐ {karma} karma</span>
        <span>Joined {new Date(created_at).toLocaleDateString()}</span>
      </div>
    </Link>
  );
}
