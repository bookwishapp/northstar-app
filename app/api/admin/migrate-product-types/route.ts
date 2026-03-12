import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Run database migration to add productTypes column to Program table
 * Call this endpoint once on production: /api/admin/migrate-product-types
 * DELETE THIS FILE AFTER RUNNING
 */
export async function GET(request: NextRequest) {
  try {
    // First, check if the column already exists
    const checkResult = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Program'
      AND column_name = 'productTypes'
    `;

    const columnExists = Array.isArray(checkResult) && checkResult.length > 0;

    if (columnExists) {
      return NextResponse.json({
        success: true,
        message: 'productTypes column already exists',
        columnExists: true
      });
    }

    // Add the productTypes column with default value
    await prisma.$executeRaw`
      ALTER TABLE "Program"
      ADD COLUMN "productTypes" TEXT[] DEFAULT ARRAY['letter', 'story']::TEXT[];
    `;

    // Update existing rows to have the default value explicitly
    await prisma.$executeRaw`
      UPDATE "Program"
      SET "productTypes" = ARRAY['letter', 'story']::TEXT[]
      WHERE "productTypes" IS NULL;
    `;

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully - productTypes column added',
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