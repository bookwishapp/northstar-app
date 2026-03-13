import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface CreateSessionRequest {
  programId: string;
  deliveryType: 'digital' | 'physical';
  customerEmail: string;
  customerName?: string;
  quantity?: number;
  shippingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  billingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateSessionRequest = await request.json();
    const {
      programId,
      deliveryType,
      customerEmail,
      customerName,
      quantity = 1,
      shippingAddress,
      billingAddress,
    } = body;

    if (!programId || !deliveryType || !customerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: programId, deliveryType, customerEmail' },
        { status: 400 }
      );
    }

    const program = await prisma.program.findUnique({
      where: { id: programId },
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

    if (!program.deliveryTypes.includes(deliveryType)) {
      return NextResponse.json(
        { error: `Program does not support ${deliveryType} delivery` },
        { status: 400 }
      );
    }

    const price = deliveryType === 'digital' ? program.priceDigital : program.pricePhysical;

    if (!price) {
      return NextResponse.json(
        { error: `No price set for ${deliveryType} delivery` },
        { status: 400 }
      );
    }

    const priceInCents = Math.round(price * 100);
    const stripe = getStripeServer();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const order = await prisma.order.create({
      data: {
        source: 'website',
        holidaySlug: program.holidaySlug,
        programId,
        deliveryType,
        customerEmail,
        customerName: customerName || null,
        status: 'pending_payment',
        paymentStatus: 'pending',
        subtotal: price,
        billingAddress: billingAddress ? {
          name: billingAddress.name,
          line1: billingAddress.line1,
          line2: billingAddress.line2 || null,
          city: billingAddress.city,
          state: billingAddress.state,
          zip: billingAddress.zip,
          country: billingAddress.country,
        } as Prisma.InputJsonValue : Prisma.DbNull,
        recipientAddress: shippingAddress ? {
          name: shippingAddress.name,
          line1: shippingAddress.line1,
          line2: shippingAddress.line2 || null,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zip: shippingAddress.zip,
          country: shippingAddress.country,
        } as Prisma.InputJsonValue : Prisma.DbNull,
      },
    });

    const deliveryLabel = deliveryType === 'digital' ? 'Digital' : 'Physical';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${program.name} (${deliveryLabel})`,
              description: `${program.description || ''} - ${deliveryLabel} Delivery`,
              metadata: {
                programId,
                deliveryType,
                holidaySlug: program.holidaySlug,
              },
            },
            unit_amount: priceInCents,
          },
          quantity,
        },
      ],
      customer_email: customerEmail,
      metadata: {
        orderId: order.id,
        programId,
        holidaySlug: program.holidaySlug,
        deliveryType,
        customerEmail,
        source: 'website',
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      automatic_tax: {
        enabled: true,
      },
      shipping_address_collection: deliveryType === 'physical' ? {
        allowed_countries: ['US', 'CA'],
      } : undefined,
      phone_number_collection: {
        enabled: deliveryType === 'physical',
      },
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      orderId: order.id,
    });

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}
