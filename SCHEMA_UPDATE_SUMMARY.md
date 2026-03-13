# Database Schema Update Summary

## Completed Changes

### 1. Order Model Updates

Added 12 new fields to support payment processing and checkout:

**Payment Tracking:**
- `stripeSessionId` - Stripe Checkout Session ID
- `stripePaymentIntentId` - Stripe Payment Intent ID
- `paymentStatus` - "pending" | "paid" | "failed" | "refunded"
- `paidAt` - Payment completion timestamp

**Pricing Breakdown:**
- `subtotal` - Sum of item prices before tax/shipping
- `shippingCost` - Calculated shipping cost
- `taxAmount` - Calculated tax amount
- `totalAmount` - Final total (subtotal + shipping + tax)
- `shippingMethod` - "first_class" | "priority"
- `taxRate` - Tax rate applied (e.g., 0.0875)
- `taxJurisdiction` - Tax jurisdiction (e.g., "NY", "CA")
- `billingAddress` - Billing address JSON from Stripe

### 2. New Cart Model

Created shopping cart table with:
- `id` - Primary key (CUID)
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp
- `sessionId` - Unique browser session ID
- `expiresAt` - Cart expiration time
- `items` - Relation to CartItem[]

### 3. New CartItem Model

Created cart items table with:
- `id` - Primary key (CUID)
- `cartId` - Foreign key to Cart
- `programId` - Foreign key to Program
- `quantity` - Item quantity (default: 1)
- `deliveryType` - "digital" | "physical"
- Cascade delete when cart is deleted

### 4. Program Model Updates

Added relation:
- `cartItems` - CartItem[] back-reference

## Key Features

### Cascade Delete Behavior
When a Cart is deleted, all associated CartItems are automatically deleted via `onDelete: Cascade` constraint.

### Proper Relations
- Cart → CartItem (one-to-many, cascade delete)
- CartItem → Program (many-to-one)
- Order → Program (many-to-one, existing)

### Unique Constraints
- Cart.sessionId has unique index for fast lookups

## Files Created/Modified

### Modified:
- `/Users/terryheath/Developer/north-star-repo/prisma/schema.prisma`

### Created:
- `/Users/terryheath/Developer/north-star-repo/prisma/migrations/20260313000000_add_checkout_fields/migration.sql`
- `/Users/terryheath/Developer/north-star-repo/prisma/CHECKOUT_SCHEMA_DOCUMENTATION.md`
- `/Users/terryheath/Developer/north-star-repo/SCHEMA_UPDATE_SUMMARY.md`

## Prisma Client Status

✅ Prisma Client has been generated successfully with the new schema

## Migration Status

⚠️ Migration file created but NOT applied to database yet

The database at `postgres.railway.internal:5432` is not accessible from the local environment. The migration will need to be applied manually or when the database is accessible.

### To Apply Migration:

**Option 1: Using Prisma CLI (when database is accessible)**
```bash
npx prisma migrate dev --name add_checkout_fields
```

**Option 2: Manual SQL Execution**
```bash
psql $DATABASE_URL < prisma/migrations/20260313000000_add_checkout_fields/migration.sql
```

After migration is applied:
```bash
npx prisma generate
```

## Next Steps for Implementation

1. **Apply the migration** to your database (production/staging)
2. **Update TypeScript types** - Prisma Client types are already generated
3. **Implement cart API endpoints**:
   - POST /api/cart - Create/update cart
   - GET /api/cart/:sessionId - Retrieve cart
   - DELETE /api/cart/:sessionId - Clear cart
4. **Implement checkout flow**:
   - Create Stripe Checkout Session from cart
   - Handle payment webhooks
   - Convert cart to order on success
5. **Implement cart cleanup job** - Delete expired carts
6. **Add validation** - Ensure paymentStatus and shippingMethod enum values

## Documentation

Full documentation available in:
- `/Users/terryheath/Developer/north-star-repo/prisma/CHECKOUT_SCHEMA_DOCUMENTATION.md`

This includes:
- Detailed field descriptions
- Payment flow diagrams
- Cart to Order conversion process
- Testing recommendations
- Cleanup & maintenance procedures
