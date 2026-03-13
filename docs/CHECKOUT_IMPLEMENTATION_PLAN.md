# North Star Postal - Checkout Implementation Plan

## Executive Summary

This document outlines the complete implementation plan for adding a production-ready checkout flow to North Star Postal, enabling direct customer purchases on the website with Stripe payment processing, shipping options, and automatic tax calculation.

## Architecture Overview

### High-Level Flow
```
Holiday Page → Cart → Checkout → Payment → Order Creation → Confirmation
                         ↓
                    Tax Calculation
                    Shipping Options
                    Address Collection
```

### Key Technologies
- **Payment Processing**: Stripe Payment Elements (embedded checkout)
- **Tax Calculation**: Stripe Tax API
- **Database**: PostgreSQL with Prisma ORM
- **Framework**: Next.js 15 with App Router
- **State Management**: React Context for cart
- **Styling**: Existing CSS variables system

## Database Schema Updates

### 1. Order Model Enhancements
```prisma
model Order {
  // ... existing fields ...

  // Payment tracking
  stripeSessionId      String?     // Stripe checkout session ID
  stripePaymentIntentId String?    // Stripe payment intent ID
  paymentStatus        String?     // "pending" | "paid" | "failed" | "refunded"
  paidAt               DateTime?   // When payment was completed

  // Pricing
  subtotal             Float?      // Product price
  shippingCost         Float?      // Shipping price
  taxAmount            Float?      // Tax amount
  totalAmount          Float?      // Total charged

  // Shipping
  shippingMethod       String?     // "first_class" | "priority"

  // Tax details
  taxRate              Float?      // Tax rate applied
  taxJurisdiction      String?     // Tax jurisdiction code

  // Customer billing info (for tax calculation)
  billingAddress       Json?       // { line1, line2, city, state, zip, country }
}
```

### 2. Cart Model (New)
```prisma
model Cart {
  id              String    @id @default(cuid())
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  sessionId       String    @unique // Browser session ID

  items           CartItem[]
  expiresAt       DateTime  // Auto-cleanup after 24 hours
}

model CartItem {
  id              String    @id @default(cuid())
  cartId          String
  programId       String
  quantity        Int       @default(1)
  deliveryType    String    // "digital" | "physical"

  cart            Cart      @relation(fields: [cartId], references: [id], onDelete: Cascade)
  program         Program   @relation(fields: [programId], references: [id])
}
```

## Implementation Phases

### Phase 1: Infrastructure Setup (Parallel Execution Possible)

#### Agent 1: Stripe Configuration
**Files to create/modify:**
- `/lib/stripe.ts` - Stripe SDK initialization
- `/app/api/webhooks/stripe/route.ts` - Webhook handler implementation
- `.env.local` - Add Stripe keys

**Tasks:**
1. Install Stripe packages: `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`
2. Create Stripe client singleton
3. Implement webhook signature verification
4. Set up webhook event handlers for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

#### Agent 2: Database Schema Updates
**Files to modify:**
- `/prisma/schema.prisma` - Add new fields and models
- Create migration: `npx prisma migrate dev --name add_checkout_fields`

**Tasks:**
1. Add payment fields to Order model
2. Create Cart and CartItem models
3. Generate Prisma client
4. Deploy migration to Railway (using temp endpoint method)

#### Agent 3: Cart System
**Files to create:**
- `/lib/cart.ts` - Cart utilities
- `/context/CartContext.tsx` - React Context for cart state
- `/app/api/cart/route.ts` - Cart API endpoints
- `/components/CartDrawer.tsx` - Cart UI component

**Tasks:**
1. Implement cart CRUD operations
2. Create cart context provider
3. Build cart drawer UI with item management
4. Add cart persistence in database

### Phase 2: Checkout Flow (Sequential After Phase 1)

#### Agent 4: Checkout Page
**Files to create:**
- `/app/checkout/page.tsx` - Main checkout page
- `/app/checkout/layout.tsx` - Checkout layout wrapper
- `/components/checkout/CheckoutForm.tsx` - Main form component
- `/components/checkout/OrderSummary.tsx` - Order summary sidebar
- `/components/checkout/ShippingSelector.tsx` - Shipping options
- `/components/checkout/AddressForm.tsx` - Address input fields

**Tasks:**
1. Create multi-step checkout flow:
   - Step 1: Customer information (email, name)
   - Step 2: Delivery address (if physical)
   - Step 3: Billing address (for tax)
   - Step 4: Shipping method selection
   - Step 5: Payment details
2. Implement form validation with Zod
3. Calculate totals dynamically
4. Show loading states during processing

#### Agent 5: Shipping Calculator
**Files to create:**
- `/lib/shipping.ts` - Shipping calculation logic
- `/app/api/shipping/calculate/route.ts` - Shipping cost API

**Shipping Rates:**
- First Class: $5.49 base + $2.49 per additional item
- Priority: $9.99 base + $4.99 per additional item

**Tasks:**
1. Implement shipping cost calculation
2. Create API endpoint for shipping quotes
3. Update checkout when shipping method changes
4. Store selected shipping in order

### Phase 3: Payment Processing (Sequential After Phase 2)

#### Agent 6: Payment Integration
**Files to create/modify:**
- `/app/api/checkout/session/route.ts` - Create Stripe checkout session
- `/app/api/payment/intent/route.ts` - Create payment intent
- `/components/checkout/PaymentForm.tsx` - Stripe Elements component
- `/app/checkout/success/page.tsx` - Success page
- `/app/checkout/cancel/page.tsx` - Cancel/failure page

**Tasks:**
1. Implement Stripe checkout session creation with:
   - Line items from cart
   - Customer details
   - Shipping address
   - Tax calculation enabled
   - Success/cancel URLs
2. Integrate Stripe Payment Element
3. Handle payment submission
4. Create order on successful payment
5. Clear cart after successful checkout

#### Agent 7: Tax Integration
**Files to create:**
- `/lib/tax.ts` - Tax calculation utilities
- `/app/api/tax/calculate/route.ts` - Tax calculation endpoint

**Tasks:**
1. Configure Stripe Tax settings via API
2. Enable automatic tax calculation in checkout sessions
3. Pass customer billing address for tax jurisdiction
4. Display tax amount in checkout summary
5. Store tax details with order

### Phase 4: Order Management Updates (Parallel After Phase 3)

#### Agent 8: Order Creation Flow
**Files to modify:**
- `/app/api/orders/route.ts` - Update for website orders
- `/lib/email.ts` - Add order confirmation template
- `/lib/order.ts` - Order processing utilities

**Tasks:**
1. Modify order creation for website purchases:
   - Skip claim token generation for paid orders
   - Directly move to `pending_generation` status
   - Store all customer info from checkout
2. Send order confirmation email (not claim email)
3. Include order tracking link
4. Generate invoice/receipt

#### Agent 9: Customer Order Tracking
**Files to create:**
- `/app/track/page.tsx` - Order tracking page
- `/app/api/orders/track/route.ts` - Tracking API
- `/components/OrderTracker.tsx` - Tracking UI component

**Tasks:**
1. Create public order tracking page
2. Allow tracking by order ID + email
3. Show order status timeline
4. Display estimated delivery date
5. Show tracking number when available

### Phase 5: UI/UX Enhancements (Parallel After Phase 3)

#### Agent 10: Holiday Page Updates
**Files to modify:**
- `/components/HolidayPage.tsx` - Update Select buttons
- `/components/ProgramCard.tsx` - Add to cart functionality

**Tasks:**
1. Replace console.log with actual cart addition
2. Show "Add to Cart" instead of "Select"
3. Display quantity selector for physical items
4. Show delivery type selector inline
5. Add visual feedback on cart addition

#### Agent 11: Navigation Updates
**Files to modify:**
- `/components/HomePage.tsx` - Add cart icon to nav
- `/app/globals.css` - Cart badge styles

**Tasks:**
1. Add cart icon with item count badge
2. Show cart drawer on icon click
3. Update navigation for checkout flow
4. Add breadcrumbs in checkout

## API Endpoints Summary

### New Endpoints to Create
1. **POST /api/cart** - Add item to cart
2. **GET /api/cart** - Get current cart
3. **PATCH /api/cart/[itemId]** - Update cart item
4. **DELETE /api/cart/[itemId]** - Remove from cart
5. **POST /api/checkout/session** - Create Stripe session
6. **POST /api/tax/calculate** - Calculate tax
7. **POST /api/shipping/calculate** - Calculate shipping
8. **GET /api/orders/track** - Track order by ID/email
9. **POST /api/webhooks/stripe** - Handle Stripe webhooks (update existing stub)

### Modified Endpoints
1. **POST /api/orders** - Support website order creation
2. **GET /api/orders/[id]/status** - Enhanced tracking info

## Environment Variables Required

```env
# Stripe (Production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Stripe Tax
STRIPE_TAX_ENABLED=true

# App URLs
NEXT_PUBLIC_APP_URL=https://northstarpostal.com
```

## Testing Strategy

### Unit Tests
- Cart calculations
- Shipping cost calculations
- Tax calculation mocks
- Order state transitions

### Integration Tests
- Full checkout flow
- Payment success/failure
- Webhook processing
- Order creation

### Manual Testing Checklist
- [ ] Add single item to cart
- [ ] Add multiple items to cart
- [ ] Update cart quantities
- [ ] Remove items from cart
- [ ] Complete checkout with digital product
- [ ] Complete checkout with physical product
- [ ] Complete checkout with mixed items
- [ ] Test shipping method changes
- [ ] Test tax calculation for different states
- [ ] Test payment success
- [ ] Test payment failure
- [ ] Test order confirmation email
- [ ] Test order tracking
- [ ] Test webhook processing
- [ ] Test cart persistence across sessions

## Security Considerations

1. **PCI Compliance**: Use Stripe Elements/Payment Element for card handling
2. **Webhook Verification**: Always verify Stripe webhook signatures
3. **Rate Limiting**: Add rate limiting to checkout endpoints
4. **Input Validation**: Validate all form inputs with Zod
5. **CSRF Protection**: Use Next.js built-in CSRF protection
6. **Session Security**: Secure session cookies for cart
7. **Address Validation**: Validate shipping addresses before processing

## Performance Optimizations

1. **Cart Caching**: Use React Query for cart state
2. **Lazy Loading**: Lazy load Stripe libraries
3. **Image Optimization**: Optimize product images in cart
4. **Database Queries**: Optimize with proper indexes
5. **API Routes**: Use edge runtime where possible

## Deployment Strategy

1. **Development Testing**: Full testing in development environment
2. **Database Migration**: Use temporary endpoint method for Railway
3. **Environment Setup**: Configure all Stripe keys in Railway
4. **Webhook Configuration**: Set up Stripe webhook endpoint
5. **Monitoring**: Set up error tracking (Sentry)
6. **Gradual Rollout**: Feature flag for checkout (optional)

## Success Metrics

- Checkout completion rate > 70%
- Payment success rate > 95%
- Average checkout time < 3 minutes
- Cart abandonment rate < 30%
- Zero payment security incidents

## Timeline Estimate

With parallel agent execution:
- Phase 1: 2-3 hours (parallel)
- Phase 2: 2-3 hours (sequential)
- Phase 3: 3-4 hours (sequential)
- Phase 4: 2-3 hours (parallel)
- Phase 5: 1-2 hours (parallel)

**Total: 10-15 hours with parallel execution**

## Risk Mitigation

1. **Payment Failures**: Implement retry logic and clear error messages
2. **Tax Calculation Errors**: Fallback to estimated tax if API fails
3. **Cart Loss**: Persist cart in database with session recovery
4. **Webhook Failures**: Implement webhook retry queue
5. **Performance Issues**: Add caching and optimize queries

## Post-Launch Tasks

1. Monitor checkout funnel analytics
2. A/B test checkout flow variations
3. Implement abandoned cart recovery emails
4. Add promo code functionality
5. Consider subscription options for repeat customers

## Agent Execution Instructions

### Parallel Execution Groups

**Group 1 (Can start immediately):**
- Agent 1: Stripe Configuration
- Agent 2: Database Schema Updates
- Agent 3: Cart System

**Group 2 (After Group 1 completes):**
- Agent 4: Checkout Page
- Agent 5: Shipping Calculator

**Group 3 (After Group 2 completes):**
- Agent 6: Payment Integration
- Agent 7: Tax Integration

**Group 4 (After Group 3 completes):**
- Agent 8: Order Creation Flow
- Agent 9: Customer Order Tracking
- Agent 10: Holiday Page Updates
- Agent 11: Navigation Updates

Each agent should:
1. Create all specified files
2. Implement complete functionality (no TODOs)
3. Test the implementation
4. Commit changes with descriptive message
5. Document any deviations from plan

## Conclusion

This plan provides a complete roadmap for implementing a production-ready checkout flow with Stripe payment processing, tax calculation, and shipping options. The parallel execution strategy will significantly reduce implementation time while maintaining code quality and completeness.