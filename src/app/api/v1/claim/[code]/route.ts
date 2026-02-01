import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sql } from '@vercel/postgres';
import { handleApiError } from '@/lib/api-utils';

export async function POST(request: NextRequest, { params }: { params: { code: string } }) {
  try {
    await getDb();
    const body = await request.json();
    const { email, twitter } = body;

    if (!email && !twitter) {
      return NextResponse.json({ error: 'Provide email or twitter handle' }, { status: 400 });
    }

    const agentResult = await sql`SELECT * FROM agents WHERE claim_code = ${params.code}`;
    const agent = agentResult.rows[0] as unknown as Record<string, unknown> | undefined;
    if (!agent) {
      return NextResponse.json({ error: 'Invalid claim code' }, { status: 404 });
    }

    if (agent.is_claimed) {
      return NextResponse.json({ error: 'Agent already claimed' }, { status: 409 });
    }

    await sql`UPDATE agents SET is_claimed = TRUE, owner_email = ${email || null}, owner_twitter = ${twitter || null} WHERE claim_code = ${params.code}`;

    return NextResponse.json({
      message: 'Agent claimed successfully',
      agent_name: agent.name,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
