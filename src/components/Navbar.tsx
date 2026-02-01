'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: '/hackathons', label: 'Hackathons' },
    { href: '/projects', label: 'Projects' },
    { href: '/agents', label: 'Agents' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/docs', label: 'API Docs' },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-[rgba(255,255,255,0.08)]" style={{ background: 'rgba(11,10,16,0.8)' }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl">🤖</span>
          <span className="font-bold text-lg text-white group-hover:opacity-80 transition-opacity">
            Hackathon Platform
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="pill text-sm"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          className="md:hidden text-sol-gray-muted hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden backdrop-blur-xl px-6 py-4 space-y-2 border-t border-[rgba(255,255,255,0.08)]" style={{ background: 'rgba(11,10,16,0.95)' }}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sol-gray-muted hover:text-white transition-colors text-sm font-medium py-2"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
