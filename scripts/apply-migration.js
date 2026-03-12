#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function applyMigration() {
  const prisma = new PrismaClient();

  try {
    console.log('Checking current database schema...');

    // Check if columns exist
    const checkColumns = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Order'
      AND column_name IN ('regenerationCount', 'contentApprovedAt')
    `;

    if (checkColumns.length === 2) {
      console.log('✅ Migration already applied - columns exist');
      return;
    }

    console.log('Applying migration to add content approval fields...');

    // Apply migration
    await prisma.$executeRaw`
      ALTER TABLE "Order"
      ADD COLUMN IF NOT EXISTS "regenerationCount" INTEGER NOT NULL DEFAULT 0
    `;

    await prisma.$executeRaw`
      ALTER TABLE "Order"
      ADD COLUMN IF NOT EXISTS "contentApprovedAt" TIMESTAMP(3)
    `;

    console.log('✅ Migration applied successfully!');

    // Verify
    const verifyColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'Order'
      AND column_name IN ('regenerationCount', 'contentApprovedAt')
    `;

    console.log('Columns added:', verifyColumns);

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();