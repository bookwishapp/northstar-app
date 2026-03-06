import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPostGridWebhook } from '@/lib/postgrid';

export async function POST(req: Request) {
  try {
    // Get raw body and signature
    const body = await req.text();
    const signature = req.headers.get('x-postgrid-signature') || '';

    // Verify webhook authenticity (placeholder for now)
    if (!verifyPostGridWebhook(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);

    // PostGrid webhook events
    const { event, letter } = data;

    if (!letter?.description) {
      return NextResponse.json({ received: true });
    }

    // Extract order ID from description (e.g., "Holiday letter for Order cm3x...")
    const orderIdMatch = letter.description.match(/Order\s+(\w+)/);
    if (!orderIdMatch) {
      console.log('Could not extract order ID from PostGrid webhook');
      return NextResponse.json({ received: true });
    }

    const orderId = orderIdMatch[1];

    // Update order based on PostGrid event
    switch (event) {
      case 'letter.created':
        // Letter was successfully created at PostGrid
        await prisma.order.update({
          where: { id: orderId },
          data: {
            postgridLetterId: letter.id,
          },
        });
        break;

      case 'letter.sent':
        // Letter has been mailed
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'delivered',
            errorMessage: null,
          },
        });
        break;

      case 'letter.failed':
        // Letter failed to send
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'failed',
            errorMessage: `Physical delivery failed: ${letter.failureReason || 'Unknown error'}`,
          },
        });
        break;

      case 'letter.returned':
        // Letter was returned to sender
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'failed',
            errorMessage: 'Physical letter was returned to sender',
          },
        });
        break;

      case 'letter.delivered':
        // Letter was confirmed delivered (if tracking available)
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'delivered',
            errorMessage: null,
          },
        });
        break;

      default:
        console.log(`Unhandled PostGrid event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PostGrid webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}