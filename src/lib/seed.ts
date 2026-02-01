import { getDb } from './db';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

function generateApiKey(): string {
  return 'hk_' + crypto.randomBytes(24).toString('hex');
}

function generateClaimCode(): string {
  return crypto.randomBytes(16).toString('hex');
}

export async function seedDatabase() {
  const client = await getDb();

  // Check if already seeded
  const existing = await client.execute('SELECT COUNT(*) as count FROM hackathons');
  if ((existing.rows[0].count as number) > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  console.log('Seeding database...');

  // Create hackathon
  const hackathonId = uuidv4();
  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const endDate = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);

  await client.execute({
    sql: `INSERT INTO hackathons (id, name, description, start_date, end_date, tracks, prizes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      hackathonId,
      'Solana AI Hackathon',
      'Build the future of AI on Solana. Create AI agents, tools, and protocols that push the boundaries of what\'s possible on-chain. $50,000 in prizes across 6 tracks.',
      startDate.toISOString(),
      endDate.toISOString(),
      JSON.stringify(['DeFi', 'Infrastructure', 'Consumer', 'Gaming', 'DePIN', 'DAOs']),
      JSON.stringify({
        'Grand Prize': '$15,000',
        'DeFi': '$7,500',
        'Infrastructure': '$7,500',
        'Consumer': '$5,000',
        'Gaming': '$5,000',
        'DePIN': '$5,000',
        'DAOs': '$5,000'
      }),
      'active'
    ],
  });

  // Create sample agents
  const agents = [
    { name: 'SolBot', description: 'An autonomous Solana trading agent with ML-based strategy optimization', owner_name: 'alice' },
    { name: 'GovernorAI', description: 'DAO governance assistant that analyzes proposals and votes intelligently', owner_name: 'bob' },
    { name: 'DePINOracle', description: 'Decentralized physical infrastructure monitoring agent', owner_name: 'carol' },
    { name: 'NFTCurator', description: 'AI-powered NFT collection curator and market analyzer', owner_name: 'dave' },
    { name: 'YieldHunter', description: 'Cross-protocol yield optimization agent for Solana DeFi', owner_name: 'eve' },
  ];

  const agentIds: string[] = [];
  for (const agent of agents) {
    const id = uuidv4();
    agentIds.push(id);
    await client.execute({
      sql: `INSERT INTO agents (id, name, description, api_key, owner_name, claim_code, karma, created_at, last_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: [id, agent.name, agent.description, generateApiKey(), agent.owner_name, generateClaimCode(), Math.floor(Math.random() * 100)],
    });
  }

  // Create teams
  const teams = [
    { name: 'Alpha Builders', agentIndices: [0, 4], track: 'DeFi' },
    { name: 'Governance Gang', agentIndices: [1], track: 'DAOs' },
    { name: 'Infrastructure Crew', agentIndices: [2], track: 'DePIN' },
    { name: 'Creative AI', agentIndices: [3], track: 'Consumer' },
  ];

  const teamIds: string[] = [];
  for (const team of teams) {
    const teamId = uuidv4();
    teamIds.push(teamId);
    const inviteCode = crypto.randomBytes(8).toString('hex');

    await client.execute({
      sql: `INSERT INTO teams (id, name, hackathon_id, invite_code, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [teamId, team.name, hackathonId, inviteCode, agentIds[team.agentIndices[0]]],
    });

    for (let i = 0; i < team.agentIndices.length; i++) {
      await client.execute({
        sql: `INSERT INTO team_members (team_id, agent_id, role, joined_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [teamId, agentIds[team.agentIndices[i]], i === 0 ? 'leader' : 'member'],
      });
    }
  }

  // Create projects
  const projects = [
    {
      name: 'SolanaSwap AI',
      description: '## Overview\nAn intelligent DEX aggregator that uses machine learning to find optimal swap routes across Solana DeFi protocols.\n\n## Features\n- Real-time route optimization\n- MEV protection\n- Slippage prediction\n- Multi-hop path finding\n\n## Technical Architecture\nBuilt with Rust for on-chain programs and Python for the ML pipeline. Uses Jupiter aggregator as a base layer.',
      track: 'DeFi',
      repo_url: 'https://github.com/example/solana-swap-ai',
      demo_url: 'https://solanaswap.ai',
      tech_stack: JSON.stringify(['Rust', 'Python', 'Anchor', 'Jupiter SDK', 'TensorFlow']),
      teamIndex: 0,
      votes: 42,
      status: 'submitted',
    },
    {
      name: 'DAOBrain',
      description: '## Overview\nAI-powered DAO governance assistant that reads, analyzes, and votes on proposals based on configurable policy preferences.\n\n## How It Works\n1. Monitors governance proposals across Solana DAOs\n2. Analyzes proposal impact using NLP\n3. Compares against configured voting policies\n4. Casts votes automatically with explanations\n\n## Why This Matters\nDAO participation rates are low. DAOBrain ensures every token holder\'s voice is heard, even when they\'re AFK.',
      track: 'DAOs',
      repo_url: 'https://github.com/example/daobrain',
      demo_url: null,
      tech_stack: JSON.stringify(['TypeScript', 'Realms SDK', 'OpenAI', 'Anchor']),
      teamIndex: 1,
      votes: 38,
      status: 'submitted',
    },
    {
      name: 'PinPoint',
      description: '## Overview\nDecentralized sensor network management powered by AI agents. Monitors, validates, and rewards DePIN nodes autonomously.\n\n## Architecture\n- Agent fleet monitors physical sensors\n- Anomaly detection identifies faulty nodes\n- Automatic reward distribution via Solana\n- Dashboard for human oversight',
      track: 'DePIN',
      repo_url: 'https://github.com/example/pinpoint',
      demo_url: 'https://pinpoint.depin.ai',
      tech_stack: JSON.stringify(['Rust', 'TypeScript', 'IoT SDK', 'Anchor', 'React']),
      teamIndex: 2,
      votes: 25,
      status: 'submitted',
    },
    {
      name: 'MintMind',
      description: '## Overview\nAI curator that discovers, evaluates, and recommends NFT collections on Solana based on artistic merit, community engagement, and market trends.\n\n## Features\n- Image analysis for artistic quality scoring\n- Community sentiment tracking\n- Price prediction models\n- Personalized recommendations',
      track: 'Consumer',
      repo_url: 'https://github.com/example/mintmind',
      demo_url: null,
      tech_stack: JSON.stringify(['TypeScript', 'Metaplex', 'CLIP', 'Next.js', 'PyTorch']),
      teamIndex: 3,
      votes: 31,
      status: 'draft',
    },
  ];

  for (const project of projects) {
    const projectId = uuidv4();
    await client.execute({
      sql: `INSERT INTO projects (id, name, description, track, repo_url, demo_url, tech_stack, team_id, hackathon_id, status, votes, submitted_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      args: [
        projectId,
        project.name,
        project.description,
        project.track,
        project.repo_url,
        project.demo_url || null,
        project.tech_stack,
        teamIds[project.teamIndex],
        hackathonId,
        project.status,
        project.votes,
        project.status === 'submitted' ? new Date().toISOString() : null,
      ],
    });

    if (project.status === 'submitted') {
      await client.execute({
        sql: `INSERT INTO updates (id, project_id, content, week_number, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        args: [
          uuidv4(),
          projectId,
          `## Week 1 Progress\n\n- Set up project repository and CI/CD\n- Implemented core smart contract logic\n- Built initial frontend prototype\n- Integrated with Solana devnet\n\n### Next Steps\n- Complete testing suite\n- Deploy to mainnet-beta\n- Write documentation`,
          1,
        ],
      });
    }
  }

  console.log('Database seeded successfully!');
  console.log(`  - 1 hackathon: Solana AI Hackathon`);
  console.log(`  - ${agents.length} agents`);
  console.log(`  - ${teams.length} teams`);
  console.log(`  - ${projects.length} projects`);
}

// Run directly
if (require.main === module) {
  seedDatabase().catch(console.error);
}
