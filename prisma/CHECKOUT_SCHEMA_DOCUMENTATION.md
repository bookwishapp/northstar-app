# Checkout Schema Documentation

This document describes the database schema additions made to support the North Star Postal website checkout flow.

## Schema Changes Overview

### Order Model - Payment & Checkout Fields

Added fields to track payment processing and pricing breakdown for website orders:

#### Payment Tracking

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `stripeSessionId` | String | Yes | Stripe Checkout Session ID - tracks the checkout session |
| `stripePaymentIntentId` | String | Yes | Stripe Payment Intent ID - tracks the actual payment |
| `paymentStatus` | String | Yes | Current payment status: "pending", "paid", "failed", or "refunded" |
| `paidAt` | DateTime | Yes | Timestamp when payment was successfully completed |

#### Pricing Breakdown

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| `subtotal` | Float | Yes | Sum of item prices before tax and shipping |
| `shippingCost` | Float | Yes | Calculated shipping cost based on delivery method |
| `taxAmount` | Float | Yes | Calculated tax amount based on tax rate and jurisdiction |
| `totalAmount` | Float | Yes | Final total: subtotal + shippingCost + taxAmount |
| `shippingMethod` | String | Yes | Shipping method selected: "first_class" or "priority" |
| `taxRate` | Float | Yes | Tax rate applied (e.g., 0.0875 for 8.75%) |
| `taxJurisdiction` | String | Yes | Tax jurisdiction identifier (e.g., "NY", "CA") |
| `billingAddress` | Json | Yes | Billing address from Stripe (full address object) |

**Note**: All checkout-related fields are nullable because:
- Existing orders from Etsy don't have this data
- Orders created before checkout implementation don't need payment tracking
- Only website orders (`source = "website"`) will populate these fields

### New Cart Model

Represents a shopping cart session for website visitors before checkout.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | String | Yes | Primary key (CUID) |
| `createdAt` | DateTime | Yes | Cart creation timestamp |
| `updatedAt` | DateTime | Yes | Last update timestamp |
| `sessionId` | String | Yes (Unique) | Browser session ID for cart persistence |
| `expiresAt` | DateTime | Yes | Cart expiration time (typically 24 hours from creation) |

**Relations**:
- `items`: One-to-many with `CartItem` (cascade delete)

**Indexing**:
- `sessionId` has a unique index for fast lookups by session

**Lifecycle**:
1. Cart is created when user adds first item
2. Cart is looked up by sessionId on subsequent visits
3. Cart expires after `expiresAt` (should be cleaned up by background job)
4. Cart is converted to Order when payment succeeds
5. Cart can be deleted when checkout completes or expires

### New CartItem Model

Represents individual items in a shopping cart.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | String | Yes | CUID | Primary key |
| `cartId` | String | Yes | - | Foreign key to Cart |
| `programId` | String | Yes | - | Foreign key to Program |
| `quantity` | Int | Yes | 1 | Number of items (typically 1 for personalized products) |
| `deliveryType` | String | Yes | - | "digital" or "physical" |

**Relations**:
- `cart`: Many-to-one with `Cart` (cascade delete when cart is deleted)
- `program`: Many-to-one with `Program` (references the program/product)

**Cascade Delete Behavior**:
- When a Cart is deleted, all associated CartItems are automatically deleted
- This ensures no orphaned cart items remain in the database

### Program Model Updates

Added relation to support cart functionality:

| Field | Type | Description |
|-------|------|-------------|
| `cartItems` | CartItem[] | Back-reference to CartItems that reference this program |

## Payment Status Flow

```
Order Creation (website source)
    ↓
paymentStatus: "pending"
stripeSessionId: [session_id]
    ↓
Payment Success Webhook
    ↓
paymentStatus: "paid"
stripePaymentIntentId: [intent_id]
paidAt: [timestamp]
subtotal, taxAmount, shippingCost, totalAmount: [calculated]
    ↓
Order Processing (existing flow)
```

## Cart to Order Conversion

When a customer completes checkout:

1. Stripe Checkout Session is created from Cart
2. On successful payment, webhook fires
3. Create Order record with:
   - Payment fields from Stripe
   - Program details from CartItem
   - Customer info from Stripe Customer object
   - Pricing breakdown from Stripe line items
4. Delete Cart and CartItems (cleanup)
5. Send claim email with claimToken

## Database Constraints & Validation

### Order Model Constraints
- `stripeSessionId` and `stripePaymentIntentId` should be indexed for webhook lookups
- `paymentStatus` should be validated to only allow: "pending", "paid", "failed", "refunded"
- `shippingMethod` should be validated to only allow: "first_class", "priority"

### Cart Model Constraints
- `sessionId` must be unique (enforced by unique index)
- `expiresAt` should be set to NOW() + 24 hours on creation

### CartItem Model Constraints
- `deliveryType` should be validated to only allow: "digital", "physical"
- `quantity` must be positive integer
- Cascade delete ensures referential integrity

## Migration Instructions

The migration file `20260313000000_add_checkout_fields/migration.sql` contains all necessary SQL statements.

To apply the migration:

```bash
# If database is accessible locally
npx prisma migrate dev --name add_checkout_fields

# Or apply manually in production
psql $DATABASE_URL < prisma/migrations/20260313000000_add_checkout_fields/migration.sql
```

After applying the migration:

```bash
# Regenerate Prisma Client
npx prisma generate
```

## Testing Recommendations

1. **Test Cart CRUD operations**:
   - Create cart with sessionId
   - Add/remove cart items
   - Update quantities
   - Verify cascade delete of items when cart is deleted

2. **Test Order payment flow**:
   - Create order with payment fields
   - Update payment status
   - Verify all pricing fields are stored correctly

3. **Test edge cases**:
   - Expired carts
   - Failed payments
   - Refunded orders
   - Cart with multiple items

## Cleanup & Maintenance

### Cart Expiration Cleanup

Implement a background job (cron/scheduled task) to delete expired carts:

```typescript
// Example cleanup query
await prisma.cart.deleteMany({
  where: {
    expiresAt: {
      lt: new Date() // Less than current time
    }
  }
});
```

### Payment Status Monitoring

Monitor orders with:
- `paymentStatus = "pending"` for more than 1 hour (likely abandoned)
- `paymentStatus = "failed"` (may need customer follow-up)
- Missing `paidAt` timestamp when `paymentStatus = "paid"` (data integrity issue)

## Implementation Notes

- All monetary values (subtotal, taxAmount, shippingCost, totalAmount) are stored as Float in cents (e.g., $19.99 = 1999.0) for precision
- Tax rates are stored as decimals (e.g., 8.75% = 0.0875)
- Billing address is stored as JSON to accommodate Stripe's address format
- Cart sessionId should be generated on frontend (e.g., UUID) and stored in localStorage/cookie
