import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'debug-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Test basic connection
    const dbTest = await prisma.$queryRaw`SELECT 1 as test`;

    // Check if Holiday table exists
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'Holiday'
    `;

    // Get all table names
    const allTables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    // Check migration status
    const migrations = await prisma.$queryRaw`
      SELECT * FROM "_prisma_migrations"
      ORDER BY finished_at DESC
      LIMIT 5
    `;

    // Try to query holidays directly
    let holidayData: any = null;
    let holidayError: any = null;
    try {
      holidayData = await prisma.$queryRaw`SELECT * FROM "Holiday"`;
    } catch (e) {
      holidayError = e instanceof Error ? e.message : 'Unknown error';
    }

    // Try using Prisma client
    let prismaHolidays: any = null;
    let prismaError: any = null;
    try {
      prismaHolidays = await prisma.holiday.findMany();
    } catch (e) {
      prismaError = e instanceof Error ? e.message : 'Unknown error';
    }

    return NextResponse.json({
      success: true,
      connection: 'OK',
      holidayTableExists: tableCheck,
      allTables,
      recentMigrations: migrations,
      rawHolidayQuery: {
        data: holidayData,
        error: holidayError
      },
      prismaQuery: {
        data: prismaHolidays,
        error: prismaError
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}