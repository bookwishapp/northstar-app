import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');

    // Check if new fields exist by querying for them
    const templateCheck = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Template'
      AND column_name IN ('returnAddress', 'envelopeBackgroundKey', 'emailHeaderKey', 'fontSize', 'letterDateFormat', 'letterDateCustom')
    `;

    const orderCheck = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'Order'
      AND column_name = 'recipientAddress'
    `;

    return NextResponse.json({
      success: true,
      migration: '20260311134907_add_critical_fields',
      templateFields: templateCheck,
      orderFields: orderCheck,
      status: 'Migration check complete'
    });

  } catch (error) {
    console.error('Migration check failed:', error);
    return NextResponse.json({
      success: false,
      error: String(error),
      status: 'Migration may not be applied'
    }, { status: 500 });
  }
}