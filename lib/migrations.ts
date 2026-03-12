import { prisma } from '@/lib/prisma';

let migrationApplied = false;

/**
 * Apply runtime migrations for content approval fields
 * This runs once when the fields are first accessed
 */
export async function ensureContentApprovalFields() {
  if (migrationApplied) return;

  try {
    // Check if columns exist
    const checkColumns = await prisma.$queryRaw<Array<{column_name: string}>>`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Order'
      AND column_name IN ('regenerationCount', 'contentApprovedAt')
    `;

    if (checkColumns.length === 2) {
      migrationApplied = true;
      console.log('✅ Content approval fields already exist');
      return;
    }

    console.log('Applying runtime migration for content approval fields...');

    // Add regenerationCount if it doesn't exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Order"
        ADD COLUMN "regenerationCount" INTEGER NOT NULL DEFAULT 0
      `;
      console.log('✅ Added regenerationCount column');
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        throw e;
      }
    }

    // Add contentApprovedAt if it doesn't exist
    try {
      await prisma.$executeRaw`
        ALTER TABLE "Order"
        ADD COLUMN "contentApprovedAt" TIMESTAMP(3)
      `;
      console.log('✅ Added contentApprovedAt column');
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        throw e;
      }
    }

    migrationApplied = true;
    console.log('✅ Runtime migration completed successfully');

  } catch (error) {
    console.error('Warning: Could not apply runtime migration:', error);
    // Don't throw - let the app continue even if migration fails
    // The new features just won't be available
  }
}