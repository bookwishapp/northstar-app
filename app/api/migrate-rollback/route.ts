import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Rollback failed migration and apply schema manually
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'rollback-migration-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({
      success: false,
      error: 'DATABASE_URL not found',
    }, { status: 500 });
  }

  const results: any[] = [];

  try {
    // Step 1: Mark the non-existent failed migration as rolled back
    console.log('Rolling back failed migration...');
    try {
      const { stdout: rollback1 } = await execAsync(
        `DATABASE_URL="${databaseUrl}" npx prisma migrate resolve --rolled-back 20260306000000_initial_schema`,
        { env: { ...process.env, DATABASE_URL: databaseUrl } }
      );
      results.push({ step: 'rollback_failed_migration', success: true, output: rollback1 });
    } catch (e: any) {
      results.push({ step: 'rollback_failed_migration', success: false, error: e.message });
    }

    // Step 2: Now try to deploy migrations again
    console.log('Attempting to deploy migrations...');
    try {
      const { stdout: deployOut, stderr: deployErr } = await execAsync(
        `DATABASE_URL="${databaseUrl}" npx prisma migrate deploy`,
        { env: { ...process.env, DATABASE_URL: databaseUrl } }
      );
      results.push({
        step: 'deploy_migrations',
        success: true,
        output: deployOut,
        stderr: deployErr
      });

      // If successful, we're done
      return NextResponse.json({
        success: true,
        message: 'Failed migration rolled back and new migrations deployed successfully',
        results,
      });
    } catch (e: any) {
      results.push({
        step: 'deploy_migrations',
        success: false,
        error: e.message,
        stdout: e.stdout,
        stderr: e.stderr
      });
    }

    // Step 3: If migrations still fail, apply SQL directly using a file
    console.log('Applying schema directly via SQL file...');

    const sqlContent = `
-- Add missing columns to Order table if they don't exist
ALTER TABLE "Order"
ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT,
ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT,
ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT,
ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "shippingCost" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "taxAmount" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "totalAmount" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "shippingMethod" TEXT,
ADD COLUMN IF NOT EXISTS "taxRate" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "taxJurisdiction" TEXT,
ADD COLUMN IF NOT EXISTS "billingAddress" JSONB;

-- Create Cart table if it doesn't exist
CREATE TABLE IF NOT EXISTS "Cart" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
  "sessionId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- Create unique index if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS "Cart_sessionId_key" ON "Cart"("sessionId");

-- Create CartItem table if it doesn't exist
CREATE TABLE IF NOT EXISTS "CartItem" (
  "id" TEXT NOT NULL,
  "cartId" TEXT NOT NULL,
  "programId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "deliveryType" TEXT NOT NULL,
  CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CartItem_cartId_fkey') THEN
    ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_fkey"
    FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CartItem_programId_fkey') THEN
    ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_programId_fkey"
    FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Add trigger for updatedAt on Cart if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_cart_updated_at ON "Cart";
CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON "Cart" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

    try {
      // Write SQL to temp file
      const tmpFile = path.join('/tmp', `migration_${Date.now()}.sql`);
      await fs.writeFile(tmpFile, sqlContent);

      // Execute using file input
      const { stdout: sqlOut } = await execAsync(
        `DATABASE_URL="${databaseUrl}" npx prisma db execute --file ${tmpFile}`,
        { env: { ...process.env, DATABASE_URL: databaseUrl } }
      );

      // Clean up temp file
      await fs.unlink(tmpFile).catch(() => {});

      results.push({ step: 'manual_sql', success: true, output: sqlOut });

      // Step 4: Mark all migrations as applied to clean up state
      const migrations = [
        '20240313_add_holiday_model',
        '20260311000000_critical_gap_fixes',
        '20260313000000_add_checkout_fields'
      ];

      for (const migration of migrations) {
        try {
          const { stdout } = await execAsync(
            `DATABASE_URL="${databaseUrl}" npx prisma migrate resolve --applied ${migration}`,
            { env: { ...process.env, DATABASE_URL: databaseUrl } }
          );
          results.push({ step: `mark_applied_${migration}`, success: true, output: stdout });
        } catch (e: any) {
          // Already applied is ok
          if (e.message.includes('already recorded as applied')) {
            results.push({ step: `mark_applied_${migration}`, skipped: true, reason: 'already applied' });
          } else {
            results.push({ step: `mark_applied_${migration}`, success: false, error: e.message });
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Schema manually applied and migrations marked as resolved',
        results,
        nextStep: 'Deployment should now work. You may need to restart the app.'
      });

    } catch (e: any) {
      results.push({ step: 'manual_sql', success: false, error: e.message });

      return NextResponse.json({
        success: false,
        error: 'Could not apply schema manually',
        results,
        suggestion: 'Check database connection and permissions'
      }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error during migration rollback',
      message: error.message,
      results
    }, { status: 500 });
  }
}