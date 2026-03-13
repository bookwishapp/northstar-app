import Stripe from 'stripe';
import { loadStripe, type Stripe as StripeClient } from '@stripe/stripe-js';

/**
 * Server-side Stripe client singleton
 * Used for API calls from server components and API routes
 */
let stripeInstance: Stripe | null = null;

export function getStripeServer(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-02-25.clover',
      typescript: true,
    });
  }

  return stripeInstance;
}

/**
 * Client-side Stripe promise
 * Used for Stripe Elements in browser components
 */
let stripePromise: Promise<StripeClient | null> | null = null;

export function getStripeClient(): Promise<StripeClient | null> {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set in environment variables');
    return Promise.resolve(null);
  }

  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }

  return stripePromise;
}

/**
 * Line item for Stripe checkout session
 */
export interface CheckoutLineItem {
  price_data: {
    currency: string;
    product_data: {
      name: string;
      description?: string;
      images?: string[];
      metadata?: Record<string, string>;
    };
    unit_amount: number; // Amount in cents
  };
  quantity: number;
}

/**
 * Metadata for order tracking
 */
export interface OrderMetadata extends Record<string, string> {
  orderId: string;
  programId: string;
  holidaySlug: string;
  deliveryType: string;
  customerEmail: string;
  source: string;
}

/**
 * Options for creating a checkout session
 */
export interface CreateCheckoutSessionOptions {
  lineItems: CheckoutLineItem[];
  metadata: OrderMetadata;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  shippingAddressCollection?: boolean;
  allowPromotionCodes?: boolean;
  automaticTax?: boolean;
  shippingOptions?: Stripe.Checkout.SessionCreateParams.ShippingOption[];
}

/**
 * Create a Stripe Checkout session
 *
 * @param options - Configuration for the checkout session
 * @returns The created Stripe Checkout Session
 */
export async function createCheckoutSession(
  options: CreateCheckoutSessionOptions
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeServer();

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    line_items: options.lineItems,
    metadata: options.metadata,
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    customer_email: options.customerEmail,
    allow_promotion_codes: options.allowPromotionCodes ?? true,
    billing_address_collection: 'required',
  };

  // Enable shipping address collection if requested
  if (options.shippingAddressCollection) {
    sessionParams.shipping_address_collection = {
      allowed_countries: ['US', 'CA'], // North America only
    };
  }

  // Add shipping options if provided
  if (options.shippingOptions && options.shippingOptions.length > 0) {
    sessionParams.shipping_options = options.shippingOptions;
  }

  // Enable automatic tax calculation if requested
  if (options.automaticTax) {
    sessionParams.automatic_tax = {
      enabled: true,
    };
  }

  // Set payment method types
  sessionParams.payment_method_types = ['card'];

  const session = await stripe.checkout.sessions.create(sessionParams);

  return session;
}

/**
 * Create line items for a program order
 *
 * @param programName - Name of the program (e.g., "Santa Letter - Deluxe")
 * @param deliveryType - Digital or physical delivery
 * @param priceInCents - Price in cents
 * @param quantity - Quantity to purchase
 * @param programId - Program ID for metadata
 * @returns Array of line items for Stripe
 */
export function createProgramLineItems(
  programName: string,
  deliveryType: 'digital' | 'physical',
  priceInCents: number,
  quantity: number = 1,
  programId: string
): CheckoutLineItem[] {
  const deliveryLabel = deliveryType === 'digital' ? 'Digital Delivery' : 'Physical Delivery';

  return [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${programName} (${deliveryLabel})`,
          description: `Personalized ${programName.toLowerCase()} with ${deliveryLabel.toLowerCase()}`,
          metadata: {
            programId,
            deliveryType,
          },
        },
        unit_amount: priceInCents,
      },
      quantity,
    },
  ];
}

/**
 * Create shipping options for physical delivery
 *
 * @param baseShippingCost - Base shipping cost in cents
 * @returns Array of shipping options for Stripe
 */
export function createShippingOptions(
  baseShippingCost: number = 299 // $2.99 default
): Stripe.Checkout.SessionCreateParams.ShippingOption[] {
  return [
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: {
          amount: baseShippingCost,
          currency: 'usd',
        },
        display_name: 'First Class Mail',
        delivery_estimate: {
          minimum: {
            unit: 'business_day',
            value: 3,
          },
          maximum: {
            unit: 'business_day',
            value: 5,
          },
        },
      },
    },
    {
      shipping_rate_data: {
        type: 'fixed_amount',
        fixed_amount: {
          amount: baseShippingCost + 300, // Add $3.00 for priority
          currency: 'usd',
        },
        display_name: 'Priority Mail',
        delivery_estimate: {
          minimum: {
            unit: 'business_day',
            value: 1,
          },
          maximum: {
            unit: 'business_day',
            value: 3,
          },
        },
      },
    },
  ];
}

/**
 * Verify Stripe webhook signature
 *
 * @param payload - Raw request body as string or Buffer
 * @param signature - Stripe signature header
 * @returns Verified Stripe event
 * @throws Error if signature verification fails
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripeServer();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set in environment variables');
  }

  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
    return event;
  } catch (err) {
    const error = err as Error;
    throw new Error(`Webhook signature verification failed: ${error.message}`);
  }
}

/**
 * Retrieve a checkout session with expanded data
 *
 * @param sessionId - Stripe Checkout Session ID
 * @returns The checkout session with line items and payment intent
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeServer();

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items', 'payment_intent', 'customer'],
  });

  return session;
}

/**
 * Retrieve a payment intent
 *
 * @param paymentIntentId - Stripe Payment Intent ID
 * @returns The payment intent
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeServer();

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  return paymentIntent;
}

/**
 * Create a refund for a payment intent
 *
 * @param paymentIntentId - Stripe Payment Intent ID
 * @param amount - Optional partial refund amount in cents
 * @param reason - Reason for refund
 * @returns The created refund
 */
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
): Promise<Stripe.Refund> {
  const stripe = getStripeServer();

  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  };

  if (amount) {
    refundParams.amount = amount;
  }

  if (reason) {
    refundParams.reason = reason;
  }

  const refund = await stripe.refunds.create(refundParams);

  return refund;
}
