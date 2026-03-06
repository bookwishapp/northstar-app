import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/orders/[id]/status
 * Public order status for tracking page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find order by ID
    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        deliveryType: true,
        createdAt: true,
        claimedAt: true,
        recipientName: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Return public status information
    return NextResponse.json({
      status: order.status,
      deliveryType: order.deliveryType,
      createdAt: order.createdAt,
      claimedAt: order.claimedAt,
      recipientName: order.recipientName,
      // Friendly status messages
      statusMessage: getStatusMessage(order.status),
    });

  } catch (error) {
    console.error('Failed to fetch order status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order status' },
      { status: 500 }
    );
  }
}

/**
 * Get friendly status message for display
 */
function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    pending_claim: 'Waiting for personalization',
    pending_generation: 'Creating your magical letter',
    pending_pdf: 'Preparing your documents',
    pending_delivery: 'Getting ready to send',
    delivered: 'Delivered! Check your email',
    failed: 'There was an issue - we\'re looking into it',
  };
  return messages[status] || 'Processing your order';
}