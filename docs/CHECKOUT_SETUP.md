# Checkout System Setup Guide

## Database Migration Status ✅
The database migration has been successfully applied. The following tables and fields are now available:
- **Cart** table - For cart persistence
- **CartItem** table - For cart items
- **Order** table additions - Payment, tax, shipping fields

## Functional Components

### 1. Cart System ✅
- **API**: `/api/cart` - Add, update, remove items
- **Storage**: Persists in database with session tracking
- **Context**: `CartContext` manages client state

### 2. Checkout Flow ✅
- **Page**: `/checkout` - Multi-step form (contact, shipping, billing, payment)
- **API**: `/api/checkout` - Creates Stripe checkout session
- **Tax**: `/api/tax/calculate` - Calculates sales tax via Stripe Tax
- **Shipping**: `/api/shipping/calculate` - Flat rate shipping ($5.49/$9.99)

### 3. Payment Processing ✅
- **Stripe Checkout**: Redirects to Stripe-hosted payment page
- **Success**: `/checkout/success?session_id={id}` - Order confirmation
- **Cancel**: `/checkout/cancel` - Handle cancelled payments

### 4. Order Management ✅
- **Tracking**: `/track?order={id}` - Customer order tracking
- **Status API**: `/api/orders/{id}/status` - Get order status

## Required Configuration

### 1. Stripe Webhook Configuration 🔧

The webhook endpoint is ready at `/api/webhooks/stripe` but needs to be configured in Stripe Dashboard:

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter endpoint URL: `https://northstar-app-production-5347.up.railway.app/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
5. Copy the webhook signing secret
6. Add to Railway environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 2. Environment Variables Required

Ensure these are set in Railway:
```bash
# Stripe Keys (already set)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Webhook Secret (needs to be added)
STRIPE_WEBHOOK_SECRET=whsec_...

# Base URL (verify this is correct)
NEXT_PUBLIC_BASE_URL=https://northstar-app-production-5347.up.railway.app
```

### 3. Testing the Complete Flow

1. **Test Cart**:
   - Add items to cart from holiday pages
   - Verify cart persists across page refreshes

2. **Test Checkout**:
   - Click checkout from cart
   - Fill in customer info
   - Add shipping address (for physical items)
   - Add billing address
   - Select shipping method
   - Complete payment on Stripe

3. **Test Order Confirmation**:
   - Verify redirect to `/checkout/success`
   - Check order created in database
   - Verify email sent to customer

4. **Test Order Tracking**:
   - Use order ID from confirmation
   - Visit `/track?order={id}`
   - Verify order status displays

## Troubleshooting

### If payments aren't being confirmed:
1. Check webhook configuration in Stripe Dashboard
2. Verify STRIPE_WEBHOOK_SECRET is set correctly
3. Check Railway logs for webhook errors

### If tax calculation fails:
1. Verify Stripe Tax is enabled in Dashboard
2. Check that billing address is being collected
3. Ensure US addresses are being used (Stripe Tax limitation)

### If cart is not persisting:
1. Check browser has cookies enabled
2. Verify Cart table exists in database
3. Check for session ID in cookies

## Production Checklist

- [ ] Stripe webhook endpoint configured
- [ ] STRIPE_WEBHOOK_SECRET environment variable set
- [ ] Test complete purchase flow
- [ ] Verify order emails are sending
- [ ] Test order tracking page
- [ ] Monitor first real transactions

## Support

For issues with:
- **Payments**: Check Stripe Dashboard logs
- **Database**: Check Railway logs
- **Application**: Check Railway deployment logs