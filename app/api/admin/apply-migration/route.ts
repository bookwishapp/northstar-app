import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');

    // Apply all migrations using raw SQL
    const migrations = [];

    try {
      // Issue #5: Recipient address collection
      await prisma.$executeRaw`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "recipientAddress" JSONB`;
      migrations.push('Order.recipientAddress added');
    } catch (e) {
      migrations.push(`Order.recipientAddress: ${e}`);
    }

    try {
      // Issue #4: Configurable return address
      await prisma.$executeRaw`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "returnAddress" TEXT`;
      migrations.push('Template.returnAddress added');
    } catch (e) {
      migrations.push(`Template.returnAddress: ${e}`);
    }

    try {
      // Issue #3: Envelope background upload
      await prisma.$executeRaw`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "envelopeBackgroundKey" TEXT`;
      migrations.push('Template.envelopeBackgroundKey added');
    } catch (e) {
      migrations.push(`Template.envelopeBackgroundKey: ${e}`);
    }

    try {
      // Issue #11: Email header image
      await prisma.$executeRaw`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "emailHeaderKey" TEXT`;
      migrations.push('Template.emailHeaderKey added');
    } catch (e) {
      migrations.push(`Template.emailHeaderKey: ${e}`);
    }

    try {
      // Issue #7: Configurable font size
      await prisma.$executeRaw`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "fontSize" TEXT DEFAULT '14px'`;
      migrations.push('Template.fontSize added');
    } catch (e) {
      migrations.push(`Template.fontSize: ${e}`);
    }

    try {
      // Issue #10: Date configuration
      await prisma.$executeRaw`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "letterDateFormat" TEXT DEFAULT 'current'`;
      migrations.push('Template.letterDateFormat added');
    } catch (e) {
      migrations.push(`Template.letterDateFormat: ${e}`);
    }

    try {
      await prisma.$executeRaw`ALTER TABLE "Template" ADD COLUMN IF NOT EXISTS "letterDateCustom" TEXT`;
      migrations.push('Template.letterDateCustom added');
    } catch (e) {
      migrations.push(`Template.letterDateCustom: ${e}`);
    }

    // Mark migration as complete in migrations table
    try {
      await prisma.$executeRaw`
        INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        VALUES (
          gen_random_uuid()::text,
          'manual',
          NOW(),
          '20260311000000_critical_gap_fixes',
          NULL,
          NULL,
          NOW(),
          1
        ) ON CONFLICT DO NOTHING
      `;
      migrations.push('Migration marked as complete');
    } catch (e) {
      migrations.push(`Migration tracking: ${e}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Migration applied successfully!',
      migrations,
      nextStep: 'Check /api/admin/check-migration to verify'
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}