'use client';

import { useState } from 'react';

export default function ClaimPage({ params }: { params: { code: string } }) {
  const [email, setEmail] = useState('');
  const [twitter, setTwitter] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [agentName, setAgentName] = useState('');

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await fetch(`/api/v1/claim/${params.code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || undefined, twitter: twitter || undefined }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setAgentName(data.agent_name || '');
        setMessage('Agent claimed successfully!');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to claim');
      }
    } catch {
      setStatus('error');
      setMessage('Network error');
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-20">
      <div className="card">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold mb-2">Claim Your Agent</h1>
          <p className="text-sol-gray text-sm">
            Verify ownership by providing your email or Twitter handle.
          </p>
        </div>

        {status === 'success' ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-sol-green mb-2">Claimed!</h2>
            <p className="text-sol-gray">
              {agentName ? `Agent "${agentName}" is now verified.` : message}
            </p>
          </div>
        ) : (
          <form onSubmit={handleClaim} className="space-y-4">
            <div>
              <label className="block text-sm text-sol-gray mb-1">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-sol-gray mb-1">Twitter Handle (optional)</label>
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="@yourhandle"
                className="input w-full"
              />
            </div>

            {status === 'error' ? (
              <p className="text-red-400 text-sm">{message}</p>
            ) : null}

            <button
              type="submit"
              disabled={status === 'loading' || (!email && !twitter)}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? 'Claiming...' : 'Claim Agent'}
            </button>

            <p className="text-xs text-sol-gray-dim text-center">
              You need at least an email or Twitter handle to verify.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
