import { prisma } from '@/lib/prisma';
import { generateContent } from '@/lib/ai';
import { renderPdfs } from '@/lib/pdf';
import { sendDeliveryEmail } from '@/lib/email';
import { sendPhysicalLetter } from '@/lib/postgrid';

/**
 * Process an order through the state machine
 * States: pending_claim -> pending_generation -> pending_pdf -> pending_delivery -> delivered
 */
export async function processOrder(orderId: string): Promise<void> {
  console.log(`Starting order processing for ${orderId}`);

  try {
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
      throw new Error(`Order ${orderId} not found`);
    }

    // Validate we're in the right state to process
    if (order.status !== 'pending_generation') {
      console.log(`Order ${orderId} is not in pending_generation state (current: ${order.status})`);
      return;
    }

    // Step 1: Generate AI content
    console.log(`Generating AI content for order ${orderId}`);

    try {
      const content = await generateContent(orderId);

      // Update order with generated content
      await prisma.order.update({
        where: { id: orderId },
        data: {
          generatedLetter: content.letter,
          generatedStory: content.story,
          status: 'pending_approval', // Changed: now needs user approval
        },
      });

      console.log(`AI content generated successfully for order ${orderId}, awaiting approval`);
    } catch (error) {
      console.error(`Failed to generate AI content for order ${orderId}:`, error);

      // Update status to failed
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'AI generation failed',
        },
      });

      throw error;
    }

    // Step 2: Generate PDFs
    console.log(`Generating PDFs for order ${orderId}`);

    try {
      const pdfKeys = await renderPdfs(orderId);

      // Update order with PDF S3 keys
      await prisma.order.update({
        where: { id: orderId },
        data: {
          letterPdfKey: pdfKeys.letterKey,
          storyPdfKey: pdfKeys.storyKey,
          envelopePdfKey: pdfKeys.envelopeKey,
          status: 'pending_delivery',
        },
      });

      console.log(`PDFs generated successfully for order ${orderId}`);
    } catch (error) {
      console.error(`Failed to generate PDFs for order ${orderId}:`, error);

      // Update status to failed
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'PDF generation failed',
        },
      });

      throw error;
    }

    // Step 3: Send delivery email (for digital orders)
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        program: {
          include: {
            template: true,
          },
        },
      },
    });

    if (!updatedOrder) {
      throw new Error(`Order ${orderId} not found after PDF generation`);
    }

    // For digital delivery, send email immediately
    if (updatedOrder.deliveryType === 'digital') {
      console.log(`Sending delivery email for order ${orderId}`);

      // Retry email delivery up to 3 times with exponential backoff
      let lastError: Error | null = null;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          await sendDeliveryEmail(updatedOrder, {
            letterKey: updatedOrder.letterPdfKey!,
            storyKey: updatedOrder.storyPdfKey!,
            envelopeKey: updatedOrder.envelopePdfKey,
          });

          // Update status to delivered
          await prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'delivered',
            },
          });

          console.log(`Order ${orderId} delivered successfully via email on attempt ${attempt}`);
          lastError = null;
          break; // Success, exit retry loop

        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Email delivery failed');
          console.error(`Failed to send delivery email for order ${orderId} (attempt ${attempt}/${maxRetries}):`, error);

          if (attempt < maxRetries) {
            // Wait before retrying (exponential backoff: 2s, 4s, 8s)
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`Retrying email delivery in ${waitTime/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }

      // If all retries failed, mark as failed
      if (lastError) {
        console.error(`All email delivery attempts failed for order ${orderId}`);

        // Update status to failed
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'failed',
            errorMessage: `Email delivery failed after ${maxRetries} attempts: ${lastError.message}`,
          },
        });

        throw lastError;
      }
    } else {
      // Physical delivery via PostGrid
      console.log(`Sending physical letter via PostGrid for order ${orderId}`);

      try {
        const postgridResponse = await sendPhysicalLetter(order);
        console.log(`PostGrid letter created: ${postgridResponse.id}`);

        // Update order with PostGrid ID
        await prisma.order.update({
          where: { id: orderId },
          data: {
            postgridLetterId: postgridResponse.id,
          },
        });

        // Order will be marked as delivered when PostGrid webhook confirms delivery
        console.log(`Physical letter queued for delivery via PostGrid for order ${orderId}`);
      } catch (error) {
        console.error(`Failed to send physical letter for order ${orderId}:`, error);

        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Physical delivery failed',
          },
        });

        throw error;
      }
    }

    console.log(`Order processing completed for ${orderId}`);

  } catch (error) {
    console.error(`Order processing failed for ${orderId}:`, error);

    // Try to update the order status to failed if we haven't already
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true },
      });

      if (order && order.status !== 'failed') {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Processing failed',
          },
        });
      }
    } catch (updateError) {
      console.error(`Failed to update order status to failed:`, updateError);
    }

    // Re-throw the error for the caller to handle
    throw error;
  }
}

/**
 * Retry failed orders (admin function)
 */
export async function retryFailedOrder(orderId: string): Promise<void> {
  console.log(`Retrying failed order ${orderId}`);

  // Get the order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (order.status !== 'failed') {
    throw new Error(`Order ${orderId} is not in failed state`);
  }

  // Reset to the appropriate state based on what we have
  let newStatus = 'pending_generation';

  if (order.generatedLetter && order.generatedStory) {
    // If content exists but not approved, needs approval
    if (!order.contentApprovedAt) {
      newStatus = 'pending_approval';
    } else {
      newStatus = 'pending_pdf';
    }
  }

  if (order.letterPdfKey && order.storyPdfKey && order.envelopePdfKey) {
    newStatus = 'pending_delivery';
  }

  // Update status and clear error
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      errorMessage: null,
    },
  });

  // Restart processing
  if (newStatus === 'pending_generation') {
    await processOrder(orderId);
  } else if (newStatus === 'pending_pdf') {
    // Continue from PDF generation
    await continueFromPdf(orderId);
  } else if (newStatus === 'pending_delivery') {
    // Continue from delivery
    await continueFromDelivery(orderId);
  }
}

/**
 * Continue processing from PDF generation step
 */
async function continueFromPdf(orderId: string): Promise<void> {
  console.log(`Continuing order processing from PDF generation for ${orderId}`);

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
    throw new Error(`Order ${orderId} not found`);
  }

  try {
    // Generate PDFs
    const pdfKeys = await renderPdfs(orderId);

    // Update order with PDF S3 keys
    await prisma.order.update({
      where: { id: orderId },
      data: {
        letterPdfKey: pdfKeys.letterKey,
        storyPdfKey: pdfKeys.storyKey,
        envelopePdfKey: pdfKeys.envelopeKey,
        status: 'pending_delivery',
      },
    });

    // Continue with delivery
    await continueFromDelivery(orderId);
  } catch (error) {
    console.error(`Failed to generate PDFs for order ${orderId}:`, error);

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'PDF generation failed',
      },
    });

    throw error;
  }
}

/**
 * Continue processing after content approval
 */
export async function continueAfterApproval(orderId: string): Promise<void> {
  console.log(`Continuing order processing after approval for ${orderId}`);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (!order.contentApprovedAt) {
    throw new Error(`Order ${orderId} has not been approved yet`);
  }

  // Update status to pending_pdf and continue with PDF generation
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'pending_pdf',
    },
  });

  // Continue with PDF generation
  await continueFromPdf(orderId);
}

/**
 * Continue processing from delivery step
 */
async function continueFromDelivery(orderId: string): Promise<void> {
  console.log(`Continuing order processing from delivery for ${orderId}`);

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
    throw new Error(`Order ${orderId} not found`);
  }

  if (!order.letterPdfKey || !order.storyPdfKey || !order.envelopePdfKey) {
    throw new Error(`Order ${orderId} missing PDF keys`);
  }

  // For digital delivery, send email
  if (order.deliveryType === 'digital') {
    try {
      await sendDeliveryEmail(order, {
        letterKey: order.letterPdfKey,
        storyKey: order.storyPdfKey,
        envelopeKey: order.envelopePdfKey,
      });

      // Update status to delivered
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'delivered',
        },
      });

      console.log(`Order ${orderId} delivered successfully via email`);
    } catch (error) {
      console.error(`Failed to send delivery email for order ${orderId}:`, error);

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Email delivery failed',
        },
      });

      throw error;
    }
  } else {
    // Physical delivery via PostGrid
    console.log(`Sending physical letter via PostGrid for order ${orderId}`);

    try {
      const postgridResponse = await sendPhysicalLetter(order);
      console.log(`PostGrid letter created: ${postgridResponse.id}`);

      // Update order with PostGrid ID
      await prisma.order.update({
        where: { id: orderId },
        data: {
          postgridLetterId: postgridResponse.id,
        },
      });

      console.log(`Physical letter queued for delivery via PostGrid for order ${orderId}`);
    } catch (error) {
      console.error(`Failed to send physical letter for order ${orderId}:`, error);

      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Physical delivery failed',
        },
      });

      throw error;
    }
  }
}