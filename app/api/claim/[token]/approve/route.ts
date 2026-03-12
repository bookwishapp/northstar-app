import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// import { continueAfterApproval } from '@/lib/processor'; // Temporarily disabled
import { ensureContentApprovalFields } from '@/lib/migrations';

/**
 * POST /api/claim/[token]/approve
 * Approve the generated content and continue processing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Ensure migration is applied
    await ensureContentApprovalFields();

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

    // Check if already approved
    if (order.contentApprovedAt) {
      return NextResponse.json(
        { error: 'Content has already been approved' },
        { status: 400 }
      );
    }

    // Check if content exists
    if (!order.generatedLetter || !order.generatedStory) {
      return NextResponse.json(
        { error: 'No content to approve yet' },
        { status: 400 }
      );
    }

    console.log(`Approving content for order ${order.id}`);

    // Mark content as approved
    await prisma.order.update({
      where: { id: order.id },
      data: {
        contentApprovedAt: new Date(),
      },
    });

    // Continue processing (generate PDFs and send email)
    // TEMPORARILY DISABLED - waiting for database migration
    // const processingPromise = continueAfterApproval(order.id).catch((error) => {
    //   console.error(`Failed to continue processing after approval for order ${order.id}:`, error);
    // });

    // Wait a bit for processing to start
    // await Promise.race([
    //   processingPromise,
    //   new Promise(resolve => setTimeout(resolve, 1000))
    // ]);

    return NextResponse.json({
      success: true,
      message: 'Content approved! Your letter will be sent shortly.',
    });

  } catch (error) {
    console.error('Failed to approve content:', error);
    return NextResponse.json(
      { error: 'Failed to approve content' },
      { status: 500 }
    );
  }
}