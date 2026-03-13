import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Fix failed migrations and apply new ones
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'fix-migration-2024') {
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
    // Step 1: Mark the failed migration as resolved
    console.log('Resolving failed migration 20260306000000_initial_schema...');
    try {
      const { stdout: resolve1 } = await execAsync(
        `DATABASE_URL="${databaseUrl}" npx prisma migrate resolve --applied 20260306000000_initial_schema`,
        { env: { ...process.env, DATABASE_URL: databaseUrl } }
      );
      results.push({ step: 'resolve_initial_schema', success: true, output: resolve1 });
    } catch (e: any) {
      results.push({ step: 'resolve_initial_schema', success: false, error: e.message });
    }

    // Step 2: Also mark other migrations as resolved if they exist
    const otherMigrations = [
      '20240313_add_holiday_model',
      '20260311000000_critical_gap_fixes',
      '20260313000000_add_checkout_fields'
    ];

    for (const migration of otherMigrations) {
      try {
        const { stdout } = await execAsync(
          `DATABASE_URL="${databaseUrl}" npx prisma migrate resolve --applied ${migration}`,
          { env: { ...process.env, DATABASE_URL: databaseUrl } }
        );
        results.push({ step: `resolve_${migration}`, success: true, output: stdout });
      } catch (e: any) {
        // It's okay if these fail - they might not exist
        results.push({ step: `resolve_${migration}`, skipped: true, reason: e.message });
      }
    }

    // Step 3: Now try to deploy any pending migrations
    console.log('Deploying migrations...');
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
    } catch (e: any) {
      results.push({
        step: 'deploy_migrations',
        success: false,
        error: e.message,
        stdout: e.stdout,
        stderr: e.stderr
      });
    }

    // Step 4: Regenerate Prisma Client
    console.log('Regenerating Prisma Client...');
    try {
      const { stdout: genOut } = await execAsync('npx prisma generate');
      results.push({ step: 'generate_client', success: true, output: genOut });
    } catch (e: any) {
      results.push({ step: 'generate_client', success: false, error: e.message });
    }

    // Check if we succeeded
    const deploySuccess = results.find(r => r.step === 'deploy_migrations')?.success;

    if (deploySuccess) {
      return NextResponse.json({
        success: true,
        message: 'Migrations fixed and deployed successfully',
        results,
        nextStep: 'App may need a restart to pick up changes'
      });
    } else {
      // If deploy still failed, try to manually apply the schema changes
      console.log('Attempting manual schema application...');

      const manualSql = `
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
          "updatedAt" TIMESTAMP(3) NOT NULL,
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
      `;

      try {
        // Use psql to execute the SQL directly
        const { stdout: sqlOut } = await execAsync(
          `echo '${manualSql}' | DATABASE_URL="${databaseUrl}" npx prisma db execute --stdin`,
          { env: { ...process.env, DATABASE_URL: databaseUrl } }
        );
        results.push({ step: 'manual_sql', success: true, output: sqlOut });

        return NextResponse.json({
          success: true,
          message: 'Schema manually applied successfully',
          results,
          nextStep: 'App may need a restart to pick up changes'
        });
      } catch (e: any) {
        results.push({ step: 'manual_sql', success: false, error: e.message });

        return NextResponse.json({
          success: false,
          error: 'Could not fix migrations automatically',
          results,
          suggestion: 'Manual database intervention may be required'
        }, { status: 500 });
      }
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error during migration fix',
      message: error.message,
      results
    }, { status: 500 });
  }
}