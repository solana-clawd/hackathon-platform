import { NextResponse } from 'next/server';
import { checkDbHealth, isDatabaseConfigured } from '@/lib/db';

export async function GET() {
  const dbHealth = await checkDbHealth();

  const response = {
    status: dbHealth.ok ? 'healthy' : 'unhealthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      configured: isDatabaseConfigured(),
      connected: dbHealth.ok,
      latencyMs: dbHealth.latencyMs,
      ...(dbHealth.error ? { error: dbHealth.error } : {}),
    },
  };

  return NextResponse.json(response, {
    status: dbHealth.ok ? 200 : 503,
  });
}
