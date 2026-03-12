import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateContent } from '@/lib/ai';

/**
 * POST /api/claim/[token]/regenerate
 * Regenerate the AI content (limited to 3 times)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

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
        { error: 'Content has already been approved and cannot be regenerated' },
        { status: 400 }
      );
    }

    // Check regeneration limit
    const maxRegenerations = 3;
    if (order.regenerationCount >= maxRegenerations) {
      return NextResponse.json(
        { error: `Maximum regeneration limit (${maxRegenerations}) reached` },
        { status: 400 }
      );
    }

    console.log(`Regenerating content for order ${order.id} (attempt ${order.regenerationCount + 1})`);

    try {
      // Generate new content
      const content = await generateContent(order.id);

      // Update order with new content and increment regeneration count
      await prisma.order.update({
        where: { id: order.id },
        data: {
          generatedLetter: content.letter,
          generatedStory: content.story,
          regenerationCount: order.regenerationCount + 1,
          status: 'pending_approval', // Keep in approval state
        },
      });

      console.log(`Content regenerated successfully for order ${order.id}`);

      return NextResponse.json({
        success: true,
        message: 'Content regenerated successfully!',
        regenerationCount: order.regenerationCount + 1,
        remainingRegenerations: maxRegenerations - (order.regenerationCount + 1),
      });

    } catch (error) {
      console.error(`Failed to regenerate content for order ${order.id}:`, error);

      // Don't increment regeneration count on failure
      return NextResponse.json(
        { error: 'Failed to regenerate content. Please try again.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Failed to regenerate content:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate content' },
      { status: 500 }
    );
  }
}