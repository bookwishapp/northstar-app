/**
 * Helper functions and examples for using Stripe integration
 *
 * This file contains reusable patterns for creating checkout sessions
 * and handling common Stripe operations in the North Star Postal application.
 */

import {
  createCheckoutSession,
  createProgramLineItems,
  createShippingOptions,
  type OrderMetadata,
} from './stripe';
import { prisma } from './prisma';

/**
 * Create a checkout session for a program purchase
 *
 * This is the main function to use when a customer wants to purchase
 * a program (e.g., Santa Letter, Easter Letter, etc.)
 *
 * @param programId - The program ID from the database
 * @param deliveryType - 'digital' or 'physical'
 * @param customerEmail - Customer's email address
 * @param successUrl - URL to redirect to after successful payment
 * @param cancelUrl - URL to redirect to if payment is cancelled
 * @returns The Stripe Checkout Session
 */
export async function createProgramCheckoutSession(
  programId: string,
  deliveryType: 'digital' | 'physical',
  customerEmail: string,
  successUrl: string,
  cancelUrl: string
) {
  // Fetch program details from database
  const program = await prisma.program.findUnique({
    where: { id: programId },
    include: { template: true },
  });

  if (!program) {
    throw new Error('Program not found');
  }

  if (!program.isActive) {
    throw new Error('Program is not active');
  }

  // Verify delivery type is supported
  if (!program.deliveryTypes.includes(deliveryType)) {
    throw new Error(`Program does not support ${deliveryType} delivery`);
  }

  // Get price based on delivery type
  const price = deliveryType === 'digital' ? program.priceDigital : program.pricePhysical;

  if (!price) {
    throw new Error(`No price set for ${deliveryType} delivery`);
  }

  // Convert price to cents
  const priceInCents = Math.round(price * 100);

  // Create line items
  const lineItems = createProgramLineItems(
    program.name,
    deliveryType,
    priceInCents,
    1,
    programId
  );

  // Generate a unique order ID (will be created in database by webhook)
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Create metadata for order tracking
  const metadata: OrderMetadata = {
    orderId,
    programId,
    holidaySlug: program.holidaySlug,
    deliveryType,
    customerEmail,
    source: 'website',
  };

  // Create checkout session options
  const sessionOptions = {
    lineItems,
    metadata,
    customerEmail,
    successUrl,
    cancelUrl,
    shippingAddressCollection: deliveryType === 'physical',
    automaticTax: true,
    allowPromotionCodes: true,
    shippingOptions: deliveryType === 'physical' ? createShippingOptions() : undefined,
  };

  // Create the session
  const session = await createCheckoutSession(sessionOptions);

  return {
    session,
    orderId,
  };
}

/**
 * Calculate pricing breakdown for a program
 *
 * This is useful for displaying price information to customers
 * before they go to checkout.
 *
 * @param programId - The program ID from the database
 * @param deliveryType - 'digital' or 'physical'
 * @returns Pricing breakdown
 */
export async function calculateProgramPricing(
  programId: string,
  deliveryType: 'digital' | 'physical'
) {
  const program = await prisma.program.findUnique({
    where: { id: programId },
  });

  if (!program) {
    throw new Error('Program not found');
  }

  const basePrice = deliveryType === 'digital' ? program.priceDigital : program.pricePhysical;

  if (!basePrice) {
    throw new Error(`No price set for ${deliveryType} delivery`);
  }

  // Calculate shipping cost for physical delivery
  const shippingCost = deliveryType === 'physical' ? 2.99 : 0;

  // Note: Tax will be calculated by Stripe at checkout based on customer address
  return {
    basePrice,
    shippingCost,
    subtotal: basePrice + shippingCost,
    currency: 'USD',
    note: 'Tax will be calculated at checkout based on your address',
  };
}

/**
 * Get checkout session URL for a program
 *
 * This is a convenience function that creates a checkout session
 * and returns just the URL for redirecting the customer.
 *
 * @param programId - The program ID from the database
 * @param deliveryType - 'digital' or 'physical'
 * @param customerEmail - Customer's email address
 * @returns Object with checkout URL and order ID
 */
export async function getCheckoutUrl(
  programId: string,
  deliveryType: 'digital' | 'physical',
  customerEmail: string,
  baseUrl: string = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
) {
  const successUrl = `${baseUrl}/order/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/order/cancelled`;

  const { session, orderId } = await createProgramCheckoutSession(
    programId,
    deliveryType,
    customerEmail,
    successUrl,
    cancelUrl
  );

  if (!session.url) {
    throw new Error('Failed to create checkout session URL');
  }

  return {
    url: session.url,
    orderId,
    sessionId: session.id,
  };
}

/**
 * Validate webhook event for security
 *
 * This should be called in your webhook handler before processing any event.
 * The main webhook handler in /app/api/webhooks/stripe/route.ts already does this.
 */
export { verifyWebhookSignature } from './stripe';

/**
 * Example usage in an API route:
 *
 * ```typescript
 * // app/api/checkout/route.ts
 * import { NextRequest, NextResponse } from 'next/server';
 * import { getCheckoutUrl } from '@/lib/stripe-helpers';
 *
 * export async function POST(request: NextRequest) {
 *   try {
 *     const { programId, deliveryType, customerEmail } = await request.json();
 *
 *     const { url, orderId } = await getCheckoutUrl(
 *       programId,
 *       deliveryType,
 *       customerEmail
 *     );
 *
 *     return NextResponse.json({
 *       checkoutUrl: url,
 *       orderId,
 *     });
 *   } catch (error) {
 *     console.error('Checkout creation failed:', error);
 *     return NextResponse.json(
 *       { error: 'Failed to create checkout' },
 *       { status: 500 }
 *     );
 *   }
 * }
 * ```
 *
 * Example usage in a client component:
 *
 * ```typescript
 * 'use client';
 * import { useState } from 'react';
 *
 * export function CheckoutButton({ programId, deliveryType }) {
 *   const [loading, setLoading] = useState(false);
 *
 *   const handleCheckout = async () => {
 *     setLoading(true);
 *     try {
 *       const response = await fetch('/api/checkout', {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify({
 *           programId,
 *           deliveryType,
 *           customerEmail: 'customer@example.com',
 *         }),
 *       });
 *
 *       const { checkoutUrl } = await response.json();
 *       window.location.href = checkoutUrl;
 *     } catch (error) {
 *       console.error('Checkout failed:', error);
 *       alert('Failed to start checkout');
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *
 *   return (
 *     <button onClick={handleCheckout} disabled={loading}>
 *       {loading ? 'Loading...' : 'Checkout'}
 *     </button>
 *   );
 * }
 * ```
 */
