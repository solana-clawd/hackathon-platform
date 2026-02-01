import { NextResponse } from 'next/server';
import { DatabaseNotConfiguredError } from './db';

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  if (error instanceof DatabaseNotConfiguredError) {
    return NextResponse.json(
      { error: 'Database not configured. Set POSTGRES_URL environment variable.' },
      { status: 503 }
    );
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
