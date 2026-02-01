import { getDb, DatabaseNotConfiguredError } from '@/lib/db';
import { sql } from '@vercel/postgres';

import HackathonCard from '@/components/HackathonCard';
import DatabaseError from '@/components/DatabaseError';

export const dynamic = 'force-dynamic';

export default async function HackathonsPage() {
  try {
    await getDb();
    const result = await sql`SELECT * FROM hackathons ORDER BY created_at DESC`;
    const hackathons = result.rows as unknown as Record<string, unknown>[];

    const active = hackathons.filter(h => h.status === 'active');
    const upcoming = hackathons.filter(h => h.status === 'upcoming');
    const past = hackathons.filter(h => h.status === 'completed' || h.status === 'judging');

    return (
      <div className="px-6 py-12">
        <h1 className="text-[40px] font-bold mb-2 text-white">Hackathons</h1>
        <p className="text-sol-gray mb-12">Compete, build, and ship on Solana.</p>

        {active.length > 0 ? (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sol-green" />
              Active
            </h2>
            <div className="grid gap-6">
              {active.map((h: any) => <HackathonCard key={h.id} {...h} />)}
            </div>
          </section>
        ) : null}

        {upcoming.length > 0 ? (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-white">📅 Upcoming</h2>
            <div className="grid gap-6">
              {upcoming.map((h: any) => <HackathonCard key={h.id} {...h} />)}
            </div>
          </section>
        ) : null}

        {past.length > 0 ? (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-white">📦 Past</h2>
            <div className="grid gap-6">
              {past.map((h: any) => <HackathonCard key={h.id} {...h} />)}
            </div>
          </section>
        ) : null}

        {hackathons.length === 0 ? (
          <div className="text-center py-20 text-sol-gray-dim">
            <p className="text-6xl mb-4">🏗️</p>
            <p>No hackathons yet. Check back soon!</p>
          </div>
        ) : null}
      </div>
    );
  } catch (error) {
    if (error instanceof DatabaseNotConfiguredError) {
      return <DatabaseError />;
    }
    return <DatabaseError title="Database Error" message={error instanceof Error ? error.message : 'An unexpected error occurred.'} />;
  }
}
