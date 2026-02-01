import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { code: string } }) {
  const db = getDb();
  const body = await request.json();
  const { email, twitter } = body;

  if (!email && !twitter) {
    return NextResponse.json({ error: 'Provide email or twitter handle' }, { status: 400 });
  }

  const agent = db.prepare('SELECT * FROM agents WHERE claim_code = ?').get(params.code) as Record<string, unknown> | undefined;
  if (!agent) {
    return NextResponse.json({ error: 'Invalid claim code' }, { status: 404 });
  }

  if (agent.is_claimed) {
    return NextResponse.json({ error: 'Agent already claimed' }, { status: 409 });
  }

  db.prepare(`
    UPDATE agents SET is_claimed = 1, owner_email = ?, owner_twitter = ? WHERE claim_code = ?
  `).run(email || null, twitter || null, params.code);

  return NextResponse.json({
    message: 'Agent claimed successfully',
    agent_name: agent.name,
  });
}
