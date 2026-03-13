import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// TEMPORARY ENDPOINT - REMOVE AFTER MIGRATION
// This endpoint is used to run database migrations on Railway
// since Railway doesn't provide a SQL console or way to run migrations directly

export async function GET(request: Request) {
  // Simple auth check - you should trigger this manually after deploy
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Use a simple secret for one-time use
  if (secret !== 'run-migration-2024') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('Starting database migration...');

    // Run the Prisma migration
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');

    console.log('Migration stdout:', stdout);
    if (stderr) console.error('Migration stderr:', stderr);

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      output: stdout,
      error: stderr || null
    });
  } catch (error: any) {
    console.error('Migration failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        message: error.message,
        stdout: error.stdout,
        stderr: error.stderr
      },
      { status: 500 }
    );
  }
}