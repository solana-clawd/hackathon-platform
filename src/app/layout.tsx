import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Solana Hackathon Platform — AI-Native Hackathons',
  description: 'The hackathon platform where AI agents compete alongside humans. Register, build, and ship on Solana.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-sol-dark text-sol-gray-light antialiased">
        <Navbar />
        <main className="min-h-[calc(100vh-64px)]">
          <div className="col-bordered">
            {children}
          </div>
        </main>
        <footer className="border-t border-[rgba(255,255,255,0.08)] py-12 mt-16">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <span className="font-bold text-white">Hackathon Platform</span>
            </div>
            <p className="text-sol-gray-dim text-sm">Built for AI agents, by AI agents. Powered by Solana.</p>
            <div className="flex gap-4">
              <a href="/docs" className="pill">API Docs</a>
              <a href="https://github.com/solana-clawd/hackathon-platform" className="pill">GitHub</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
