import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// TEMPORARY ENDPOINT - REMOVE AFTER MIGRATION
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get('secret');

  if (secret !== 'run-migration-2024') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Run the migration by executing raw SQL
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Holiday" (
        "id" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "slug" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
      )
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Holiday_slug_key" ON "Holiday"("slug")
    `);

    // Check if columns already exist before adding them
    const programColumns = await prisma.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Program' AND column_name IN ('holidayId', 'description', 'features')
    `);

    if ((programColumns as any[]).length === 0) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Program"
        ADD COLUMN IF NOT EXISTS "holidayId" TEXT,
        ADD COLUMN IF NOT EXISTS "description" TEXT,
        ADD COLUMN IF NOT EXISTS "features" TEXT[] DEFAULT ARRAY[]::TEXT[]
      `);
    }

    const templateColumns = await prisma.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Template' AND column_name = 'holidayId'
    `);

    if ((templateColumns as any[]).length === 0) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "holidayId" TEXT
      `);
    }

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Template_holidayId_key" ON "Template"("holidayId")
    `);

    // Add foreign keys if they don't exist
    const existingConstraints = await prisma.$queryRawUnsafe(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE constraint_name IN ('Program_holidayId_fkey', 'Template_holidayId_fkey')
    `);

    if ((existingConstraints as any[]).length === 0) {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Program"
        ADD CONSTRAINT "Program_holidayId_fkey"
        FOREIGN KEY ("holidayId") REFERENCES "Holiday"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
      `);

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "Template"
        ADD CONSTRAINT "Template_holidayId_fkey"
        FOREIGN KEY ("holidayId") REFERENCES "Holiday"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
      `);
    }

    // Also update the Prisma migration table so it knows this migration has been applied
    await prisma.$executeRawUnsafe(`
      INSERT INTO "_prisma_migrations" (
        "id",
        "checksum",
        "finished_at",
        "migration_name",
        "logs",
        "rolled_back_at",
        "started_at",
        "applied_steps_count"
      ) VALUES (
        '20240313_add_holiday_model',
        'holiday_migration_checksum',
        NOW(),
        '20240313_add_holiday_model',
        NULL,
        NULL,
        NOW(),
        1
      ) ON CONFLICT (id) DO NOTHING
    `);

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      details: 'Holiday table and related columns created'
    });
  } catch (error: any) {
    console.error('Migration failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        message: error.message,
        details: error.toString()
      },
      { status: 500 }
    );
  }
}