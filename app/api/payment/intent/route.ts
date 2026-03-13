import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe';
import { getCartBySessionId } from '@/lib/cart';
import { calculateShippingCost } from '@/components/checkout/ShippingSelector';
import type { ShippingMethod } from '@/components/checkout/ShippingSelector';

interface CreatePaymentIntentRequest {
  shippingMethod?: ShippingMethod;
}

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('X-Session-ID');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const cart = await getCartBySessionId(sessionId);

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    const body: CreatePaymentIntentRequest = await request.json();
    const { shippingMethod } = body;

    const physicalItems = cart.items.filter((item) => item.deliveryType === 'physical');
    const hasPhysicalItems = physicalItems.length > 0;

    let subtotal = cart.items.reduce((sum, item) => {
      const price =
        item.deliveryType === 'digital'
          ? item.program.priceDigital || 0
          : item.program.pricePhysical || 0;
      return sum + price * item.quantity;
    }, 0);

    let shippingCost = 0;
    if (hasPhysicalItems && shippingMethod) {
      const physicalItemCount = physicalItems.reduce((sum, item) => sum + item.quantity, 0);
      shippingCost = calculateShippingCost(shippingMethod, physicalItemCount);
    }

    const total = subtotal + shippingCost;
    const amountInCents = Math.round(total * 100);

    const stripe = getStripeServer();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        cartId: cart.id,
        sessionId,
        itemCount: cart.items.length.toString(),
        hasPhysicalItems: hasPhysicalItems.toString(),
        shippingMethod: shippingMethod || 'none',
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: total,
      subtotal,
      shippingCost,
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create payment intent',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const paymentIntentId = request.nextUrl.searchParams.get('payment_intent');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    const stripe = getStripeServer();

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return NextResponse.json({
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      },
    });

  } catch (error) {
    console.error('Payment intent retrieval error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to retrieve payment intent',
      },
      { status: 500 }
    );
  }
}
