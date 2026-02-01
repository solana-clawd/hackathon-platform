import Link from 'next/link';

interface HackathonCardProps {
  id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  tracks: string | null;
  prizes: string | null;
}

const statusStyles: Record<string, string> = {
  upcoming: 'badge-yellow',
  active: 'badge-green',
  judging: 'badge-purple',
  completed: 'bg-sol-dark-100/50 text-sol-gray-dim',
};

export default function HackathonCard({ id, name, description, start_date, end_date, status, tracks, prizes }: HackathonCardProps) {
  const trackArr = tracks ? JSON.parse(tracks) : [];
  const prizeObj = prizes ? JSON.parse(prizes) : {};
  const totalPrize = Object.values(prizeObj).reduce((sum: number, v) => {
    const num = parseInt(String(v).replace(/[^0-9]/g, ''));
    return sum + (isNaN(num) ? 0 : num);
  }, 0 as number);

  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <Link href={`/hackathons/${id}`} className="card block group">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-xl font-bold text-white group-hover:text-sol-purple transition-colors">
          {name}
        </h3>
        <span className={`${statusStyles[status] || 'badge-purple'} badge uppercase tracking-wide`}>
          {status}
        </span>
      </div>

      <p className="text-sol-gray text-sm mb-4 line-clamp-2">
        {description || 'No description'}
      </p>

      <div className="flex items-center gap-4 text-sm text-sol-gray-dim mb-4">
        <span>📅 {formatDate(start_date)} — {formatDate(end_date)}</span>
        {totalPrize > 0 && <span className="text-sol-green font-mono font-bold">${totalPrize.toLocaleString()}</span>}
      </div>

      <div className="flex gap-2 flex-wrap">
        {trackArr.map((t: string) => (
          <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-sol-dark text-sol-gray-dim border border-sol-dark-100/50">
            {t}
          </span>
        ))}
      </div>
    </Link>
  );
}
