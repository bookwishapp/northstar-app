import { NextRequest, NextResponse } from 'next/server';
import { getCartBySessionId } from '@/lib/cart';
import { getStripeServer } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { calculateShippingCost } from '@/components/checkout/ShippingSelector';
import type { ShippingMethod } from '@/components/checkout/ShippingSelector';
import type { Address } from '@/components/checkout/AddressForm';
import { Prisma } from '@prisma/client';

interface CheckoutRequest {
  customerEmail: string;
  customerName: string;
  shippingAddress: Address | null;
  billingAddress: Address;
  shippingMethod: ShippingMethod | null;
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

    const body: CheckoutRequest = await request.json();
    const { customerEmail, customerName, shippingAddress, billingAddress, shippingMethod } = body;

    if (!customerEmail || !customerName || !billingAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const stripe = getStripeServer();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const physicalItems = cart.items.filter((item) => item.deliveryType === 'physical');
    const hasPhysicalItems = physicalItems.length > 0;

    if (hasPhysicalItems && (!shippingAddress || !shippingMethod)) {
      return NextResponse.json(
        { error: 'Shipping address and method required for physical items' },
        { status: 400 }
      );
    }

    const lineItems = cart.items.map((item) => {
      const price =
        item.deliveryType === 'digital'
          ? item.program.priceDigital || 0
          : item.program.pricePhysical || 0;

      const priceInCents = Math.round(price * 100);
      const deliveryLabel = item.deliveryType === 'digital' ? 'Digital' : 'Physical';

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${item.program.name} (${deliveryLabel})`,
            description: `${item.program.description || ''} - ${deliveryLabel} Delivery`,
            metadata: {
              programId: item.programId,
              deliveryType: item.deliveryType,
              holidaySlug: item.program.holidaySlug,
            },
          },
          unit_amount: priceInCents,
        },
        quantity: item.quantity,
      };
    });

    let shippingCost = 0;
    if (hasPhysicalItems && shippingMethod) {
      const physicalItemCount = physicalItems.reduce((sum, item) => sum + item.quantity, 0);
      shippingCost = calculateShippingCost(shippingMethod, physicalItemCount);
      const shippingCostCents = Math.round(shippingCost * 100);

      const shippingMethodLabel =
        shippingMethod === 'first_class' ? 'First Class Mail' : 'Priority Mail';

      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Shipping - ${shippingMethodLabel}`,
            description: `Shipping for ${physicalItemCount} item${physicalItemCount > 1 ? 's' : ''}`,
            metadata: {
              programId: 'shipping',
              deliveryType: shippingMethod,
              holidaySlug: 'shipping',
            },
          },
          unit_amount: shippingCostCents,
        },
        quantity: 1,
      });
    }

    const subtotal = cart.items.reduce((sum, item) => {
      const price =
        item.deliveryType === 'digital'
          ? item.program.priceDigital || 0
          : item.program.pricePhysical || 0;
      return sum + price * item.quantity;
    }, 0);

    const orderIds = await Promise.all(
      cart.items.map(async (item) => {
        const order = await prisma.order.create({
          data: {
            source: 'website',
            holidaySlug: item.program.holidaySlug,
            programId: item.programId,
            deliveryType: item.deliveryType as 'digital' | 'physical',
            customerEmail,
            customerName,
            status: 'pending_payment',
            paymentStatus: 'pending',
            subtotal,
            shippingCost: hasPhysicalItems ? shippingCost : null,
            shippingMethod: shippingMethod || null,
            billingAddress: {
              name: billingAddress.name,
              line1: billingAddress.line1,
              line2: billingAddress.line2 || null,
              city: billingAddress.city,
              state: billingAddress.state,
              zip: billingAddress.zip,
              country: billingAddress.country,
            } as Prisma.InputJsonValue,
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
        return order.id;
      })
    );

    const orderMetadata = {
      cartId: cart.id,
      sessionId,
      customerEmail,
      customerName,
      shippingMethod: shippingMethod || 'none',
      itemCount: cart.items.length.toString(),
      hasPhysicalItems: hasPhysicalItems.toString(),
      orderIds: orderIds.join(','),
    };

    if (shippingAddress) {
      Object.assign(orderMetadata, {
        shippingName: shippingAddress.name,
        shippingLine1: shippingAddress.line1,
        shippingLine2: shippingAddress.line2 || '',
        shippingCity: shippingAddress.city,
        shippingState: shippingAddress.state,
        shippingZip: shippingAddress.zip,
        shippingCountry: shippingAddress.country,
      });
    }

    Object.assign(orderMetadata, {
      billingName: billingAddress.name,
      billingLine1: billingAddress.line1,
      billingLine2: billingAddress.line2 || '',
      billingCity: billingAddress.city,
      billingState: billingAddress.state,
      billingZip: billingAddress.zip,
      billingCountry: billingAddress.country,
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: customerEmail,
      metadata: orderMetadata,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
      automatic_tax: {
        enabled: true,
      },
      phone_number_collection: {
        enabled: hasPhysicalItems,
      },
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    await Promise.all(
      orderIds.map((orderId) =>
        prisma.order.update({
          where: { id: orderId },
          data: { stripeSessionId: session.id },
        })
      )
    );

    return NextResponse.json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}
