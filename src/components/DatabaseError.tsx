import Link from 'next/link';

interface DatabaseErrorProps {
  title?: string;
  message?: string;
}

export default function DatabaseError({ 
  title = 'Database Not Configured', 
  message 
}: DatabaseErrorProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20">
      <div className="card text-center border-yellow-500/30 bg-yellow-500/5">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-3 text-yellow-400">{title}</h1>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          {message || 'The database is not configured yet. Set the TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables to get started.'}
        </p>
        <div className="card bg-dark-bg border-dark-border text-left mb-6">
          <h3 className="text-sm font-bold text-gray-400 mb-2">Required Environment Variables</h3>
          <code className="block text-xs font-mono text-solana-green">
            TURSO_DATABASE_URL=libsql://your-db.turso.io<br />
            TURSO_AUTH_TOKEN=your-auth-token
          </code>
        </div>
        <div className="flex justify-center gap-4">
          <Link href="/docs" className="btn-primary text-sm px-4 py-2">
            View API Docs
          </Link>
          <Link href="/api/v1/health" className="btn-secondary text-sm px-4 py-2">
            Check Health
          </Link>
        </div>
      </div>
    </div>
  );
}
