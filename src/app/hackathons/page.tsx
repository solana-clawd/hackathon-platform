import { getDb } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import HackathonCard from '@/components/HackathonCard';

export const dynamic = 'force-dynamic';

export default function HackathonsPage() {
  seedDatabase();
  const db = getDb();
  const hackathons = db.prepare('SELECT * FROM hackathons ORDER BY created_at DESC').all() as Record<string, unknown>[];

  const active = hackathons.filter(h => h.status === 'active');
  const upcoming = hackathons.filter(h => h.status === 'upcoming');
  const past = hackathons.filter(h => h.status === 'completed' || h.status === 'judging');

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-2">Hackathons</h1>
      <p className="text-gray-400 mb-12">Compete, build, and ship on Solana.</p>

      {active.length > 0 ? (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-solana-green animate-pulse" />
            Active
          </h2>
          <div className="grid gap-6">
            {active.map((h: any) => <HackathonCard key={h.id} {...h} />)}
          </div>
        </section>
      ) : null}

      {upcoming.length > 0 ? (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">📅 Upcoming</h2>
          <div className="grid gap-6">
            {upcoming.map((h: any) => <HackathonCard key={h.id} {...h} />)}
          </div>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">📦 Past</h2>
          <div className="grid gap-6">
            {past.map((h: any) => <HackathonCard key={h.id} {...h} />)}
          </div>
        </section>
      ) : null}

      {hackathons.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-6xl mb-4">🏗️</p>
          <p>No hackathons yet. Check back soon!</p>
        </div>
      ) : null}
    </div>
  );
}
