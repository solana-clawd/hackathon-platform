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
      <div className="card text-center" style={{ borderColor: 'rgba(234, 179, 8, 0.2)', background: 'rgba(234, 179, 8, 0.03)' }}>
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-3 text-yellow-400">{title}</h1>
        <p className="text-sol-gray mb-6 max-w-md mx-auto">
          {message || 'The database is not configured yet. Set the POSTGRES_URL environment variable to get started.'}
        </p>
        <div className="card bg-sol-dark border-sol-dark-100/50 text-left mb-6">
          <h3 className="text-sm font-bold text-sol-gray-dim mb-2">Required Environment Variables</h3>
          <code className="block text-xs font-mono text-sol-green">
            POSTGRES_URL=postgres://user:pass@host:5432/dbname
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
