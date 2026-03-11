import { NextRequest, NextResponse } from 'next/server';
import { sendClaimEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const { id: orderId } = await params;

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        program: {
          include: {
            template: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.customerEmail) {
      return NextResponse.json(
        { error: 'Order has no customer email' },
        { status: 400 }
      );
    }

    if (order.claimedAt) {
      return NextResponse.json(
        { error: 'Order has already been claimed' },
        { status: 400 }
      );
    }

    // Send the claim email
    await sendClaimEmail(order);

    return NextResponse.json({
      success: true,
      message: `Claim email resent to ${order.customerEmail}`
    });

  } catch (error) {
    console.error('Failed to resend claim email:', error);
    return NextResponse.json(
      { error: 'Failed to resend claim email', details: String(error) },
      { status: 500 }
    );
  }
}