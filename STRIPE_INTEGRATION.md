# Stripe Integration for North Star Postal

This document describes the Stripe payment integration for the North Star Postal checkout flow.

## Overview

The Stripe integration enables customers to purchase programs (Santa Letters, Easter Letters, etc.) through a secure checkout flow with automatic tax calculation, shipping options, and order creation.

## Architecture

### Components

1. **`/lib/stripe.ts`** - Core Stripe utilities
   - Server-side Stripe client singleton
   - Client-side Stripe promise for React components
   - Checkout session creation
   - Webhook signature verification
   - Helper functions for line items, shipping, and refunds

2. **`/lib/stripe-helpers.ts`** - High-level helper functions
   - Program checkout session creation
   - Price calculation
   - Checkout URL generation
   - Usage examples

3. **`/app/api/webhooks/stripe/route.ts`** - Webhook handler
   - Verifies webhook signatures
   - Handles checkout.session.completed events
   - Handles payment_intent.succeeded events
   - Handles payment_intent.payment_failed events
   - Creates orders in database
   - Sends claim emails to customers

## Setup

### Environment Variables

Add these to your `.env` file:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Webhook Configuration

1. In your Stripe Dashboard, go to Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Testing with Stripe CLI

For local development:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will output a webhook signing secret - add it to .env
```

## Usage

### Creating a Checkout Session

```typescript
import { getCheckoutUrl } from '@/lib/stripe-helpers';

// In your API route or server component
const { url, orderId } = await getCheckoutUrl(
  programId,
  'digital', // or 'physical'
  'customer@example.com'
);

// Redirect customer to checkout
return redirect(url);
```

### Complete Example - API Route

```typescript
// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCheckoutUrl } from '@/lib/stripe-helpers';
import { z } from 'zod';

const checkoutSchema = z.object({
  programId: z.string(),
  deliveryType: z.enum(['digital', 'physical']),
  customerEmail: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = checkoutSchema.parse(body);

    const { url, orderId } = await getCheckoutUrl(
      data.programId,
      data.deliveryType,
      data.customerEmail
    );

    return NextResponse.json({
      checkoutUrl: url,
      orderId,
    });
  } catch (error) {
    console.error('Checkout creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
```

### Client-Side Integration

```typescript
'use client';
import { useState } from 'react';

export function CheckoutButton({
  programId,
  deliveryType,
  customerEmail
}: {
  programId: string;
  deliveryType: 'digital' | 'physical';
  customerEmail: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId,
          deliveryType,
          customerEmail,
        }),
      });

      const { checkoutUrl } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
    >
      {loading ? 'Loading...' : `Checkout - ${deliveryType}`}
    </button>
  );
}
```

## Webhook Flow

When a customer completes checkout:

1. **checkout.session.completed** event is sent to webhook
2. Webhook verifies signature
3. Webhook extracts metadata (orderId, programId, etc.)
4. Webhook creates order in database with status `pending_claim`
5. Webhook sends claim email to customer
6. **payment_intent.succeeded** event confirms payment
7. Order status is updated to `paid`

### Order Creation

Orders are created with the following data from Stripe:

- Customer email and name
- Billing address
- Shipping address (for physical orders)
- Payment details (session ID, payment intent ID)
- Pricing breakdown (subtotal, shipping, tax, total)
- Payment status
- Metadata (program, holiday, delivery type)

### Error Handling

- If order already exists (webhook retry), payment details are updated
- If program not found, webhook logs error and returns 200 to prevent retry
- If email fails, webhook logs error but doesn't fail (customer can get link from success page)
- Payment failures are recorded in order with error message

## Pricing

### Digital Delivery
- Base price from `program.priceDigital`
- No shipping cost
- Tax calculated by Stripe based on customer address

### Physical Delivery
- Base price from `program.pricePhysical`
- Shipping options:
  - First Class Mail: $2.99 (3-5 business days)
  - Priority Mail: $5.99 (1-3 business days)
- Tax calculated by Stripe based on customer address

## Testing

### Test Card Numbers

Use these in test mode:

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

Any future expiration date and any 3-digit CVC.

### Test Webhook Events

Using Stripe CLI:

```bash
# Trigger a successful payment
stripe trigger checkout.session.completed

# Trigger a failed payment
stripe trigger payment_intent.payment_failed
```

## Security

- All webhook events are verified using Stripe signatures
- Idempotency protection prevents duplicate orders
- Environment variables keep secrets secure
- No sensitive data stored in client-side code

## Monitoring

Key logs to monitor:

- `Received Stripe webhook: {type} ({id})`
- `Created order {orderId} from checkout session {sessionId}`
- `Marked order {orderId} as paid`
- `Webhook signature verification failed: {error}`

## Troubleshooting

### Webhook not receiving events

1. Check webhook URL is correct in Stripe Dashboard
2. Verify webhook secret matches `.env`
3. Check firewall/network allows Stripe IPs
4. Use Stripe CLI for local testing

### Order not created

1. Check webhook logs for errors
2. Verify metadata is included in checkout session
3. Ensure program exists and is active
4. Check database connection

### Tax not calculating

1. Verify `automaticTax: true` in session options
2. Check Stripe Tax is enabled in dashboard
3. Ensure customer address is collected

## Production Checklist

- [ ] Replace test API keys with live keys
- [ ] Configure webhook in production Stripe account
- [ ] Set up webhook monitoring/alerts
- [ ] Test with real payment methods
- [ ] Configure tax settings in Stripe Dashboard
- [ ] Set up refund policies
- [ ] Enable promotion codes if desired
- [ ] Configure email notifications
- [ ] Test order fulfillment flow
- [ ] Set up fraud prevention rules

## API Reference

### Main Functions

#### `createCheckoutSession(options)`
Creates a Stripe Checkout session with full configuration.

#### `createProgramLineItems(name, deliveryType, price, quantity, programId)`
Creates line items for a program purchase.

#### `createShippingOptions(baseShippingCost?)`
Creates shipping rate options for physical delivery.

#### `verifyWebhookSignature(payload, signature)`
Verifies webhook signature and returns event.

#### `getStripeServer()`
Returns server-side Stripe client instance.

#### `getStripeClient()`
Returns client-side Stripe promise for Elements.

### Helper Functions

#### `createProgramCheckoutSession(programId, deliveryType, customerEmail, successUrl, cancelUrl)`
High-level function to create checkout session for a program.

#### `calculateProgramPricing(programId, deliveryType)`
Calculates pricing breakdown for display.

#### `getCheckoutUrl(programId, deliveryType, customerEmail, baseUrl?)`
Convenience function to get checkout URL directly.

## Support

For Stripe-specific issues, consult:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
