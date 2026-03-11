import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // First, check what's in the migrations table
    const migrations = await prisma.$queryRaw`
      SELECT * FROM _prisma_migrations
      ORDER BY started_at DESC
    `;

    console.log('Current migrations:', migrations);

    // Mark the failed migration as rolled back
    const result = await prisma.$executeRaw`
      UPDATE _prisma_migrations
      SET rolled_back_at = NOW()
      WHERE migration_name = '20260311000000_add_personalization_fields'
      AND rolled_back_at IS NULL
    `;

    console.log(`Marked ${result} failed migration(s) as rolled back`);

    // Also try to add the column if it doesn't exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Template"
        ADD COLUMN IF NOT EXISTS "personalizationFields" JSONB
      `;
      console.log('Added personalizationFields column if it was missing');
    } catch (error) {
      console.log('Column might already exist or error adding it:', error);
    }

    // Now check the status again
    const updatedMigrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at, rolled_back_at
      FROM _prisma_migrations
      WHERE migration_name LIKE '%personalization%'
    `;

    return NextResponse.json({
      message: 'Migration fix applied',
      markedAsRolledBack: result,
      relatedMigrations: updatedMigrations
    });

  } catch (error) {
    console.error('Error fixing migration:', error);
    return NextResponse.json(
      { error: 'Failed to fix migration', details: String(error) },
      { status: 500 }
    );
  }
}