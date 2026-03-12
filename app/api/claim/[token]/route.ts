import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * GET /api/claim/[token]
 * Returns order data for claim page (validates token)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Find order by claim token
    const order = await prisma.order.findUnique({
      where: { claimToken: token },
      include: {
        program: {
          include: {
            template: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Invalid or expired claim token' },
        { status: 404 }
      );
    }

    // Check if already claimed
    if (order.claimedAt) {
      return NextResponse.json(
        { error: 'This order has already been claimed' },
        { status: 404 }
      );
    }

    // Return order data for claim form
    return NextResponse.json({
      order: {
        recipientName: order.recipientName,
        holidaySlug: order.holidaySlug,
        programId: order.programId,
        deliveryType: order.deliveryType,
      },
      template: {
        character: order.program.template.character,
        holidaySlug: order.program.template.holidaySlug,
        personalizationFields: order.program.template.personalizationFields,
      },
      program: {
        name: order.program.name,
        tier: order.program.tier,
      },
    });

  } catch (error) {
    console.error('Failed to fetch claim data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch claim data' },
      { status: 500 }
    );
  }
}

const addressSchema = z.object({
  name: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().min(1),
});

const claimSchema = z.object({
  customerName: z.string().min(1),
  recipientName: z.string().min(1),
  recipientAge: z.number().int().min(1).max(100),
  recipientDetails: z.record(z.string()).optional(),
  deliveryEmail: z.string().email(),
  emailConsent: z.boolean(),
  recipientAddress: addressSchema,
  deliveryAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    zip: z.string().min(1),
    country: z.string().min(1),
  }).optional(),
});

/**
 * POST /api/claim/[token]
 * Customer submits personalization form
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = claimSchema.parse(body);

    // Find order by claim token
    const order = await prisma.order.findUnique({
      where: { claimToken: token },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Invalid or expired claim token' },
        { status: 404 }
      );
    }

    // Check if already claimed
    if (order.claimedAt) {
      return NextResponse.json(
        { error: 'This order has already been claimed' },
        { status: 400 }
      );
    }

    // Validate physical delivery has address
    if (order.deliveryType === 'physical' && !validatedData.deliveryAddress) {
      return NextResponse.json(
        { error: 'Delivery address is required for physical orders' },
        { status: 400 }
      );
    }

    // Update order with personalization data
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        claimedAt: new Date(),
        customerName: validatedData.customerName,
        customerEmail: validatedData.deliveryEmail,
        recipientName: validatedData.recipientName,
        recipientAge: validatedData.recipientAge,
        recipientDetails: validatedData.recipientDetails || {},
        recipientAddress: validatedData.recipientAddress,
        deliveryAddress: validatedData.deliveryAddress || undefined,
        emailConsent: validatedData.emailConsent,
        status: 'pending_generation',
      },
    });

    console.log(`Order ${order.id} claimed successfully`);

    // Import processOrder dynamically to avoid circular dependencies
    const { processOrder } = await import('@/lib/processor');

    // Process the order with proper error handling
    // We'll wait a bit for processing to start, but not block the response too long
    const processingPromise = processOrder(order.id).catch((error) => {
      console.error(`Failed to process order ${order.id}:`, error);
      // Don't throw - we've already saved the order, just log the error
      // The retry mechanism will pick it up
    });

    // Wait up to 2 seconds for processing to start successfully
    // This ensures we catch immediate failures without blocking too long
    await Promise.race([
      processingPromise,
      new Promise(resolve => setTimeout(resolve, 2000))
    ]);

    // Check if order failed immediately
    const checkOrder = await prisma.order.findUnique({
      where: { id: order.id },
      select: { status: true, errorMessage: true }
    });

    if (checkOrder?.status === 'failed') {
      console.error(`Order ${order.id} failed immediately: ${checkOrder.errorMessage}`);
      // Still return success to user but log the failure for monitoring
    }

    return NextResponse.json({
      success: true,
      message: 'Your personalization has been received! Your letter is being created.',
      orderId: order.id,
      redirectUrl: `/claim/${token}/preview`, // Redirect to preview instead of success
    });

  } catch (error) {
    console.error('Failed to claim order:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid form data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to submit personalization' },
      { status: 500 }
    );
  }
}