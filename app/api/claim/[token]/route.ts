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

    // Check if already delivered (but allow if in approval/generation state)
    if (order.status === 'delivered' || order.status === 'pending_delivery' || order.status === 'pending_pdf') {
      return NextResponse.json(
        { error: 'This order has already been processed' },
        { status: 404 }
      );
    }

    // Get regeneration count from recipientDetails if it exists
    const recipientDetails = order.recipientDetails as any || {};
    const regenerationCount = recipientDetails._regenerationCount || 0;

    // Return order data for claim form
    return NextResponse.json({
      order: {
        id: order.id,
        recipientName: order.recipientName,
        holidaySlug: order.holidaySlug,
        programId: order.programId,
        deliveryType: order.deliveryType,
        status: order.status,
        // Include existing form data if already filled
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        recipientAge: order.recipientAge,
        recipientDetails: order.recipientDetails,
        recipientAddress: order.recipientAddress,
        deliveryAddress: order.deliveryAddress,
        emailConsent: order.emailConsent,
        // Include generated content if it exists
        generatedLetter: order.generatedLetter,
        generatedStory: order.generatedStory,
        regenerationCount: regenerationCount,
        claimedAt: order.claimedAt,
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
  action: z.enum(['generate', 'regenerate', 'approve']).optional().default('generate'),
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

    // Handle different actions
    if (validatedData.action === 'approve') {
      // Check if content exists to approve
      if (!order.generatedLetter || !order.generatedStory) {
        return NextResponse.json(
          { error: 'No content to approve yet' },
          { status: 400 }
        );
      }

      console.log(`Order ${order.id} approved by customer`);

      // Update status to proceed with PDF generation
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'pending_pdf',
        },
      });

      // Import processor to continue
      const { continueFromPdf } = await import('@/lib/processor');

      // Continue with PDF generation in background
      continueFromPdf(order.id).catch((error) => {
        console.error(`Failed to continue processing after approval for order ${order.id}:`, error);
      });

      return NextResponse.json({
        success: true,
        message: 'Content approved! Your letter will be sent shortly.',
        orderId: order.id,
      });
    }

    // Handle regenerate action
    if (validatedData.action === 'regenerate') {
      // Check regeneration limit
      const currentDetails = order.recipientDetails as any || {};
      const regenerationCount = currentDetails._regenerationCount || 0;

      if (regenerationCount >= 3) {
        return NextResponse.json(
          { error: 'Maximum regeneration limit reached (3 times)' },
          { status: 400 }
        );
      }

      console.log(`Order ${order.id} regeneration requested (attempt ${regenerationCount + 1})`);

      // Update order with new details and increment regeneration count
      const newRecipientDetails = {
        ...(validatedData.recipientDetails || {}),
        _regenerationCount: regenerationCount + 1,
        _lastRegeneratedAt: new Date().toISOString(),
      };

      await prisma.order.update({
        where: { id: order.id },
        data: {
          customerName: validatedData.customerName,
          customerEmail: validatedData.deliveryEmail,
          recipientName: validatedData.recipientName,
          recipientAge: validatedData.recipientAge,
          recipientDetails: newRecipientDetails,
          recipientAddress: validatedData.recipientAddress,
          deliveryAddress: validatedData.deliveryAddress || undefined,
          emailConsent: validatedData.emailConsent,
          generatedLetter: null, // Clear old content
          generatedStory: null,
          status: 'pending_generation',
        },
      });

      // Generate new content
      const { processOrder } = await import('@/lib/processor');
      const processingPromise = processOrder(order.id).catch((error) => {
        console.error(`Failed to regenerate content for order ${order.id}:`, error);
      });

      // Wait a bit for generation to start
      await Promise.race([
        processingPromise,
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

      return NextResponse.json({
        success: true,
        message: 'Regenerating content with updated details...',
        orderId: order.id,
        regenerationCount: regenerationCount + 1,
      });
    }

    // Default action: generate (first time)
    // Check if already claimed
    if (order.claimedAt && order.generatedLetter) {
      return NextResponse.json(
        { error: 'This order has already been personalized' },
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
    const processingPromise = processOrder(order.id).catch((error) => {
      console.error(`Failed to process order ${order.id}:`, error);
    });

    // Wait up to 2 seconds for processing to start successfully
    await Promise.race([
      processingPromise,
      new Promise(resolve => setTimeout(resolve, 2000))
    ]);

    return NextResponse.json({
      success: true,
      message: 'Generating your personalized letter...',
      orderId: order.id,
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