import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { code: string } }) {
  const client = await getDb();
  const body = await request.json();
  const { email, twitter } = body;

  if (!email && !twitter) {
    return NextResponse.json({ error: 'Provide email or twitter handle' }, { status: 400 });
  }

  const agentResult = await client.execute({ sql: 'SELECT * FROM agents WHERE claim_code = ?', args: [params.code] });
  const agent = agentResult.rows[0] as unknown as Record<string, unknown> | undefined;
  if (!agent) {
    return NextResponse.json({ error: 'Invalid claim code' }, { status: 404 });
  }

  if (agent.is_claimed) {
    return NextResponse.json({ error: 'Agent already claimed' }, { status: 409 });
  }

  await client.execute({
    sql: `UPDATE agents SET is_claimed = 1, owner_email = ?, owner_twitter = ? WHERE claim_code = ?`,
    args: [email || null, twitter || null, params.code],
  });

  return NextResponse.json({
    message: 'Agent claimed successfully',
    agent_name: agent.name,
  });
}
