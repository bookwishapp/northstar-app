import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Emergency migration endpoint that doesn't depend on any Prisma Client initialization
// This endpoint is specifically designed to work when there's a schema mismatch
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'emergency-migration-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // First, try to run the migration
    console.log('Starting emergency migration...');

    // Set DATABASE_URL explicitly from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL not found',
        suggestion: 'Check Railway environment variables'
      }, { status: 500 });
    }

    // Run migration with explicit environment variable
    const { stdout, stderr } = await execAsync(
      `DATABASE_URL="${databaseUrl}" npx prisma migrate deploy`,
      {
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl
        }
      }
    );

    // If successful, also regenerate Prisma Client
    await execAsync('npx prisma generate');

    return NextResponse.json({
      success: true,
      message: 'Emergency migration completed successfully',
      output: stdout,
      error: stderr || null,
      note: 'App may need a restart to pick up new Prisma Client'
    });
  } catch (error: any) {
    console.error('Emergency migration error:', error);

    // Try alternative approach: reset the database state
    if (error.message?.includes('already exists') || error.message?.includes('column')) {
      try {
        // Try to mark migration as applied if it partially ran
        const { stdout: resetOut } = await execAsync(
          `DATABASE_URL="${process.env.DATABASE_URL}" npx prisma migrate resolve --applied 20260313000000_add_checkout_fields`,
          { env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL } }
        );

        return NextResponse.json({
          success: true,
          message: 'Migration marked as resolved',
          output: resetOut,
          note: 'Migration may have partially applied. Check database state.'
        });
      } catch (resolveError: any) {
        return NextResponse.json({
          success: false,
          error: 'Migration failed and could not be resolved',
          mainError: error.message,
          resolveError: resolveError.message,
          stdout: error.stdout,
          stderr: error.stderr,
          suggestion: 'May need to manually fix database state'
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Emergency migration failed',
      message: error.message,
      stdout: error.stdout,
      stderr: error.stderr,
      suggestion: 'Check Railway logs for details'
    }, { status: 500 });
  }
}