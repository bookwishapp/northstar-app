import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Run database migration manually
 * DELETE THIS FILE AFTER RUNNING
 */
export async function GET(request: NextRequest) {
  try {
    // First, let's check if the column exists
    const checkResult = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Template'
      AND column_name = 'personalizationFields'
    `;

    const columnExists = Array.isArray(checkResult) && checkResult.length > 0;

    if (columnExists) {
      return NextResponse.json({
        success: true,
        message: 'Column already exists',
        columnExists: true
      });
    }

    // Add the column if it doesn't exist
    await prisma.$executeRaw`
      ALTER TABLE "Template"
      ADD COLUMN "personalizationFields" JSONB;
    `;

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      columnAdded: true
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        error: 'Failed to run migration',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}