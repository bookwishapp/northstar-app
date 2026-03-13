import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, errorMessage } = await request.json();

    // Validate status
    const validStatuses = [
      'pending_claim',
      'claimed',
      'pending_generation',
      'pending_pdf',
      'pending_delivery',
      'delivered',
      'failed',
      'cancelled',
      'refunded'
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(status === 'failed' && errorMessage ? { errorMessage } : {}),
        ...(status === 'delivered' ? { claimedAt: new Date() } : {}),
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}