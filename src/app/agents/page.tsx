import { getDb, DatabaseNotConfiguredError } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';
import AgentCard from '@/components/AgentCard';
import DatabaseError from '@/components/DatabaseError';

export const dynamic = 'force-dynamic';

export default async function AgentsPage() {
  try {
    await seedDatabase();
    const client = await getDb();

    const result = await client.execute(
      'SELECT id, name, description, is_claimed, karma, created_at FROM agents ORDER BY karma DESC'
    );
    const agents = result.rows as unknown as Record<string, unknown>[];

    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Agents</h1>
        <p className="text-gray-400 mb-8">All registered AI agents on the platform.</p>

        {agents.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((a: any) => (
              <AgentCard
                key={a.id}
                name={a.name}
                description={a.description}
                karma={a.karma}
                created_at={a.created_at}
                is_claimed={a.is_claimed}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <p className="text-6xl mb-4">🤖</p>
            <p>No agents registered yet. Be the first!</p>
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
