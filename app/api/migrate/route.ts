import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'run-migration-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      output: stdout,
      error: stderr || null
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      message: error.message,
      stdout: error.stdout,
      stderr: error.stderr
    }, { status: 500 });
  }
}