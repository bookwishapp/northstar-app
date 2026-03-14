import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'check-db-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the DATABASE_URL being used (hide password)
  const dbUrl = process.env.DATABASE_URL || 'NOT SET';
  const sanitized = dbUrl.replace(/:([^@]+)@/, ':****@');

  return NextResponse.json({
    DATABASE_URL: sanitized,
    RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'NOT SET',
    timestamp: new Date().toISOString()
  });
}