import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendClaimEmail } from '@/lib/email';
import { z } from 'zod';

// Schema for order creation
const createOrderSchema = z.object({
  externalOrderId: z.string().optional(),
  programId: z.string(),
  deliveryType: z.enum(['digital', 'physical']),
  customerEmail: z.string().email().optional(), // Optional for Etsy orders
});

/**
 * POST /api/orders
 * Admin creates order from Etsy sale
 * Protected by admin session
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // For now, we'll skip auth for initial development
    // In production, check for admin session/JWT

    const body = await request.json();

    // Validate request body
    const validatedData = createOrderSchema.parse(body);

    // Verify program exists and is active
    const program = await prisma.program.findUnique({
      where: { id: validatedData.programId },
      include: { template: true },
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    if (!program.isActive) {
      return NextResponse.json(
        { error: 'Program is not active' },
        { status: 400 }
      );
    }

    // Verify delivery type is supported by program
    if (!program.deliveryTypes.includes(validatedData.deliveryType)) {
      return NextResponse.json(
        { error: `Program does not support ${validatedData.deliveryType} delivery` },
        { status: 400 }
      );
    }

    // Create the order
    const order = await prisma.order.create({
      data: {
        source: 'etsy',
        externalOrderId: validatedData.externalOrderId || null,
        holidaySlug: program.holidaySlug,
        programId: validatedData.programId,
        deliveryType: validatedData.deliveryType,
        customerEmail: validatedData.customerEmail || null,
        status: 'pending_claim',
      },
    });

    console.log(`Created order ${order.id} from Etsy ${validatedData.externalOrderId}`);

    // Send claim email to customer if email provided
    if (validatedData.customerEmail) {
      try {
        await sendClaimEmail(order);
        console.log(`Claim email sent for order ${order.id}`);
      } catch (emailError) {
        console.error(`Failed to send claim email for order ${order.id}:`, emailError);
        // Don't fail the order creation if email fails
        // Admin can manually resend from admin panel
      }
    } else {
      console.log(`No email provided for order ${order.id} - send claim link to Etsy messages`);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        claimToken: order.claimToken,
        status: order.status,
      },
    });

  } catch (error) {
    console.error('Failed to create order:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}