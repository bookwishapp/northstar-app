import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Temporary endpoint to fix database schema
 * DELETE THIS FILE AFTER RUNNING
 */
export async function GET(request: NextRequest) {
  try {
    // Check if personalizationFields column exists
    const result = await prisma.$executeRaw`
      ALTER TABLE "Template"
      ADD COLUMN IF NOT EXISTS "personalizationFields" JSONB;
    `;

    return NextResponse.json({
      success: true,
      message: 'Database schema updated successfully',
      result
    });
  } catch (error) {
    console.error('Failed to update database schema:', error);
    return NextResponse.json(
      { error: 'Failed to update schema', details: error },
      { status: 500 }
    );
  }
}