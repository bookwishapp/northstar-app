import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/check-migration
 * Check if the content approval migration has been applied
 */
export async function GET() {
  try {
    // Try to query the new fields
    const testOrder = await prisma.order.findFirst({
      select: {
        id: true,
        regenerationCount: true,
        contentApprovedAt: true,
      },
      take: 1,
    });

    // Check the Prisma migrations table
    const migrations = await prisma.$queryRaw`
      SELECT migration_name, finished_at
      FROM _prisma_migrations
      ORDER BY finished_at DESC
      LIMIT 10
    `;

    // Check column existence directly
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'Order'
      AND column_name IN ('regenerationCount', 'contentApprovedAt')
      ORDER BY column_name
    `;

    return NextResponse.json({
      success: true,
      message: 'Migration check complete',
      newFieldsAccessible: true,
      testQuery: testOrder ? 'Success' : 'No orders found',
      migrations,
      columnsFound: columns,
    });

  } catch (error: any) {
    // If the fields don't exist, we'll get an error
    const errorMessage = error?.message || 'Unknown error';
    const fieldsMissing = errorMessage.includes('regenerationCount') ||
                          errorMessage.includes('contentApprovedAt');

    return NextResponse.json({
      success: false,
      message: 'Migration not yet applied or fields missing',
      error: errorMessage,
      fieldsMissing,
      hint: fieldsMissing ? 'The migration needs to be applied to add regenerationCount and contentApprovedAt fields' : null,
    }, { status: 500 });
  }
}