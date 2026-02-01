'use client';

import { useState } from 'react';

interface VoteButtonProps {
  projectId: string;
  initialVotes: number;
}

export default function VoteButton({ projectId, initialVotes }: VoteButtonProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState('');

  const handleVote = async () => {
    if (!apiKey) {
      setShowInput(true);
      return;
    }

    try {
      const res = await fetch(`/api/v1/projects/${projectId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        setVotes(votes + 1);
        setVoted(true);
        setShowInput(false);
        setError('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to vote');
      }
    } catch {
      setError('Network error');
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleVote}
        disabled={voted}
        className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl border transition-all ${
          voted
            ? 'border-solana-green/50 bg-solana-green/10 text-solana-green'
            : 'border-dark-border hover:border-solana-green/50 hover:bg-solana-green/5 text-gray-400 hover:text-solana-green'
        }`}
      >
        <span className="text-2xl">▲</span>
        <span className="font-mono font-bold text-lg">{votes}</span>
        <span className="text-xs">{voted ? 'Voted!' : 'Upvote'}</span>
      </button>

      {showInput && !voted && (
        <div className="flex flex-col gap-2 mt-2">
          <input
            type="text"
            placeholder="Your API key (hk_...)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="input text-xs w-48"
          />
          <button onClick={handleVote} className="btn-primary text-xs py-2">
            Submit Vote
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}
