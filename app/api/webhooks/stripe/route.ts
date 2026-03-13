import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { verifyWebhookSignature, getCheckoutSession } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendClaimEmail } from '@/lib/email';
import { Prisma } from '@prisma/client';

/**
 * POST /api/webhooks/stripe
 * Stripe webhook handler for payment events
 *
 * Handles:
 * - checkout.session.completed: Create order when checkout completes
 * - payment_intent.succeeded: Mark order as paid
 * - payment_intent.payment_failed: Mark order as failed
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature);
    } catch (err) {
      const error = err as Error;
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log(`Received Stripe webhook: ${event.type} (${event.id})`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 * Creates an order in the database when checkout completes
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`Processing checkout.session.completed: ${session.id}`);

  const metadata = session.metadata;
  if (!metadata) {
    console.error('No metadata in checkout session');
    return;
  }

  const orderIds = metadata.orderIds ? metadata.orderIds.split(',') : [];

  if (orderIds.length === 0) {
    console.error('No order IDs found in checkout session metadata');
    return;
  }

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id;

  const amount = session.amount_total ? session.amount_total / 100 : 0;
  const taxAmount = session.total_details?.amount_tax
    ? session.total_details.amount_tax / 100
    : null;

  for (const orderId of orderIds) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      console.error(`Order ${orderId} not found`);
      continue;
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripePaymentIntentId: paymentIntentId || null,
        paymentStatus: session.payment_status === 'paid' ? 'paid' : 'pending',
        paidAt: session.payment_status === 'paid' ? new Date() : null,
        taxAmount,
        totalAmount: amount / orderIds.length,
        status: 'pending_claim',
      },
    });

    console.log(`Updated order ${orderId} from checkout session ${session.id}`);

    try {
      await sendClaimEmail(order);
      console.log(`Claim email sent for order ${orderId}`);
    } catch (emailError) {
      console.error(`Failed to send claim email for order ${orderId}:`, emailError);
    }
  }
}

/**
 * Handle payment_intent.succeeded event
 * Marks order as paid when payment succeeds
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Processing payment_intent.succeeded: ${paymentIntent.id}`);

  // Find order by payment intent ID
  const order = await prisma.order.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (!order) {
    console.log(`No order found for payment intent ${paymentIntent.id}`);
    return;
  }

  // Update order payment status
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'paid',
      paidAt: new Date(),
    },
  });

  console.log(`Marked order ${order.id} as paid`);
}

/**
 * Handle payment_intent.payment_failed event
 * Marks order as failed when payment fails
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`Processing payment_intent.payment_failed: ${paymentIntent.id}`);

  // Find order by payment intent ID
  const order = await prisma.order.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
  });

  if (!order) {
    console.log(`No order found for payment intent ${paymentIntent.id}`);
    return;
  }

  // Extract error message
  const errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

  // Update order payment status
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'failed',
      errorMessage,
    },
  });

  console.log(`Marked order ${order.id} as failed: ${errorMessage}`);
}

/**
 * Update existing order with payment details from checkout session
 */
async function updateOrderPaymentDetails(orderId: string, session: Stripe.Checkout.Session) {
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id;

  const amount = session.amount_total ? session.amount_total / 100 : 0;
  const subtotal = session.amount_subtotal ? session.amount_subtotal / 100 : 0;

  const taxAmount = session.total_details?.amount_tax
    ? session.total_details.amount_tax / 100
    : null;

  const shippingCost = session.total_details?.amount_shipping
    ? session.total_details.amount_shipping / 100
    : null;

  const billingDetails = session.customer_details;

  // Extract shipping details if available (needs expanded session)
  const shippingAddress = (session as any).shipping_details?.address;
  const shippingName = (session as any).shipping_details?.name;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId || null,
      paymentStatus: session.payment_status === 'paid' ? 'paid' : 'pending',
      paidAt: session.payment_status === 'paid' ? new Date() : null,
      subtotal,
      shippingCost,
      taxAmount,
      totalAmount: amount,
      customerName: billingDetails?.name || null,
      billingAddress: billingDetails?.address ? {
        line1: billingDetails.address.line1 || null,
        line2: billingDetails.address.line2 || null,
        city: billingDetails.address.city || null,
        state: billingDetails.address.state || null,
        postal_code: billingDetails.address.postal_code || null,
        country: billingDetails.address.country || null,
      } as Prisma.InputJsonValue : Prisma.DbNull,
      recipientAddress: shippingAddress ? {
        name: shippingName || null,
        line1: shippingAddress.line1 || null,
        line2: shippingAddress.line2 || null,
        city: shippingAddress.city || null,
        state: shippingAddress.state || null,
        postal_code: shippingAddress.postal_code || null,
        country: shippingAddress.country || null,
      } as Prisma.InputJsonValue : Prisma.DbNull,
    },
  });

  console.log(`Updated payment details for order ${orderId}`);
}

/**
 * Extract shipping method from session shipping options
 */
function extractShippingMethod(session: Stripe.Checkout.Session): string | null {
  if (!session.shipping_cost?.shipping_rate) {
    return null;
  }

  // Get the shipping rate ID or display name
  const shippingRate = session.shipping_cost.shipping_rate;

  if (typeof shippingRate === 'string') {
    // If it's just an ID, we can't determine the method
    return null;
  }

  // Extract method from display name
  const displayName = shippingRate.display_name?.toLowerCase() || '';

  if (displayName.includes('priority')) {
    return 'priority';
  } else if (displayName.includes('first class')) {
    return 'first_class';
  }

  return null;
}