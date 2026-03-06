import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      service: 'northstar-app',
      timestamp: new Date().toISOString(),
      environment: process.env.RAILWAY_ENVIRONMENT || 'development',
    },
    { status: 200 }
  )
}