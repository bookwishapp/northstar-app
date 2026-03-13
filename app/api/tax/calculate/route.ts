import { NextRequest, NextResponse } from 'next/server';
import {
  calculateTax,
  calculateTaxForMixedCart,
  validateTaxAddress,
  requiresTaxCalculation,
  formatTaxDetailsForDisplay,
  getTaxCodeForDeliveryType,
  type TaxAddress,
  type TaxCartItem,
  type TaxCalculation,
} from '@/lib/tax';

/**
 * Tax Calculation API Endpoint
 *
 * POST /api/tax/calculate
 *
 * Calculates sales tax for a cart using Stripe Tax Calculation API.
 * Supports caching to avoid redundant API calls for the same address/cart.
 */

interface TaxCalculationRequest {
  items: Array<{
    priceInCents: number;
    quantity: number;
    deliveryType?: 'digital' | 'physical';
    description?: string;
  }>;
  billingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  shippingCostCents?: number;
}

interface TaxCalculationResponse {
  success: boolean;
  taxAmount: number;
  taxAmountCents: number;
  taxRate: number;
  taxRateDisplay: string;
  jurisdiction: {
    country: string;
    state?: string;
    county?: string;
    city?: string;
    displayName: string;
  };
  subtotal: number;
  total: number;
  breakdown: Array<{
    amount: number;
    rate: number;
    rateDisplay: string;
    jurisdiction: string;
    taxabilityReason: string;
    taxableAmount: number;
  }>;
  formatted: {
    subtotal: string;
    tax: string;
    taxRate: string;
    total: string;
    jurisdiction: string;
  };
  cached?: boolean;
}

interface TaxCalculationErrorResponse {
  success: false;
  error: string;
  details?: string[];
}

// Simple in-memory cache for tax calculations
// Key: hash of address + items, Value: { calculation, timestamp }
const taxCalculationCache = new Map<
  string,
  {
    calculation: TaxCalculation;
    timestamp: number;
  }
>();

// Cache TTL: 1 hour
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Generate cache key from request data
 */
function generateCacheKey(request: TaxCalculationRequest): string {
  const address = request.billingAddress;
  const itemsHash = request.items
    .map(item => `${item.priceInCents}x${item.quantity}:${item.deliveryType || 'physical'}`)
    .sort()
    .join('|');

  const addressHash = `${address.line1}|${address.city}|${address.state}|${address.zip}|${address.country}`;
  const shippingHash = request.shippingCostCents || 0;

  return `${addressHash}::${itemsHash}::${shippingHash}`;
}

/**
 * Get cached tax calculation if valid
 */
function getCachedCalculation(cacheKey: string): TaxCalculation | null {
  const cached = taxCalculationCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  // Check if cache is still valid
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL_MS) {
    // Cache expired, remove it
    taxCalculationCache.delete(cacheKey);
    return null;
  }

  return cached.calculation;
}

/**
 * Store tax calculation in cache
 */
function setCachedCalculation(cacheKey: string, calculation: TaxCalculation): void {
  taxCalculationCache.set(cacheKey, {
    calculation,
    timestamp: Date.now(),
  });

  // Clean up old cache entries (simple memory management)
  if (taxCalculationCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of taxCalculationCache.entries()) {
      if (now - value.timestamp > CACHE_TTL_MS) {
        taxCalculationCache.delete(key);
      }
    }
  }
}

/**
 * POST /api/tax/calculate
 *
 * Calculate sales tax for cart items
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<TaxCalculationResponse | TaxCalculationErrorResponse>> {
  try {
    const body: TaxCalculationRequest = await request.json();

    // Validate request
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No items provided for tax calculation',
        },
        { status: 400 }
      );
    }

    if (!body.billingAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Billing address is required for tax calculation',
        },
        { status: 400 }
      );
    }

    // Validate address
    const addressValidation = validateTaxAddress(body.billingAddress);
    if (!addressValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid billing address',
          details: addressValidation.errors,
        },
        { status: 400 }
      );
    }

    const address: TaxAddress = body.billingAddress as TaxAddress;

    // Check if tax calculation is required
    if (!requiresTaxCalculation(address)) {
      // Return zero tax for non-US addresses or invalid addresses
      return NextResponse.json({
        success: true,
        taxAmount: 0,
        taxAmountCents: 0,
        taxRate: 0,
        taxRateDisplay: '0%',
        jurisdiction: {
          country: address.country,
          displayName: address.country,
        },
        subtotal: body.items.reduce(
          (sum, item) => sum + (item.priceInCents * item.quantity) / 100,
          0
        ),
        total: body.items.reduce(
          (sum, item) => sum + (item.priceInCents * item.quantity) / 100,
          0
        ) + ((body.shippingCostCents || 0) / 100),
        breakdown: [],
        formatted: {
          subtotal: formatCurrency(
            body.items.reduce(
              (sum, item) => sum + item.priceInCents * item.quantity,
              0
            )
          ),
          tax: formatCurrency(0),
          taxRate: '0%',
          total: formatCurrency(
            body.items.reduce(
              (sum, item) => sum + item.priceInCents * item.quantity,
              0
            ) + (body.shippingCostCents || 0)
          ),
          jurisdiction: address.country,
        },
      });
    }

    // Check cache first
    const cacheKey = generateCacheKey(body);
    const cachedCalculation = getCachedCalculation(cacheKey);

    if (cachedCalculation) {
      // Return cached result
      return NextResponse.json({
        success: true,
        ...cachedCalculation,
        formatted: formatTaxDetailsForDisplay(cachedCalculation),
        cached: true,
      });
    }

    // Separate items by delivery type for proper tax coding
    const digitalItems: TaxCartItem[] = [];
    const physicalItems: TaxCartItem[] = [];

    for (const item of body.items) {
      const taxItem: TaxCartItem = {
        priceInCents: item.priceInCents,
        quantity: item.quantity,
        description: item.description,
        taxCode: getTaxCodeForDeliveryType(
          item.deliveryType || 'physical',
          false
        ),
      };

      if (item.deliveryType === 'digital') {
        digitalItems.push(taxItem);
      } else {
        physicalItems.push(taxItem);
      }
    }

    // Calculate tax
    let calculation: TaxCalculation;

    if (digitalItems.length > 0 && physicalItems.length > 0) {
      // Mixed cart - use special handler
      calculation = await calculateTaxForMixedCart(
        digitalItems,
        physicalItems,
        address,
        body.shippingCostCents
      );
    } else {
      // Single type cart
      const allItems = [...digitalItems, ...physicalItems];
      calculation = await calculateTax(
        allItems,
        address,
        body.shippingCostCents
      );
    }

    // Cache the result
    setCachedCalculation(cacheKey, calculation);

    // Return successful response
    return NextResponse.json({
      success: true,
      ...calculation,
      formatted: formatTaxDetailsForDisplay(calculation),
      cached: false,
    });
  } catch (error) {
    console.error('Tax calculation error:', error);

    // Handle specific Stripe errors
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as { type: string; message: string };

      if (stripeError.type === 'StripeInvalidRequestError') {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid request for tax calculation',
            details: [stripeError.message],
          },
          { status: 400 }
        );
      }

      if (stripeError.type === 'StripeAPIError') {
        return NextResponse.json(
          {
            success: false,
            error: 'Tax calculation service temporarily unavailable',
            details: ['Please try again in a moment'],
          },
          { status: 503 }
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate tax',
        details: [
          error instanceof Error ? error.message : 'Unknown error occurred',
        ],
      },
      { status: 500 }
    );
  }
}

/**
 * Helper to format currency
 */
function formatCurrency(amountCents: number): string {
  const dollars = amountCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/**
 * GET /api/tax/calculate
 *
 * Returns information about the tax calculation endpoint
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/tax/calculate',
    method: 'POST',
    description: 'Calculate sales tax for cart items using Stripe Tax',
    documentation: {
      request: {
        items: 'Array of cart items with priceInCents, quantity, and optional deliveryType',
        billingAddress: 'Customer billing address (required for tax calculation)',
        shippingCostCents: 'Optional shipping cost in cents',
      },
      response: {
        success: 'Boolean indicating if calculation was successful',
        taxAmount: 'Tax amount in dollars',
        taxAmountCents: 'Tax amount in cents',
        taxRate: 'Decimal tax rate (e.g., 0.0875 for 8.75%)',
        taxRateDisplay: 'Formatted tax rate string (e.g., "8.75%")',
        jurisdiction: 'Tax jurisdiction details',
        subtotal: 'Subtotal before tax in dollars',
        total: 'Total including tax in dollars',
        breakdown: 'Detailed tax breakdown by jurisdiction',
        formatted: 'Pre-formatted strings for display',
        cached: 'Whether result was returned from cache',
      },
      caching: {
        enabled: true,
        ttl: '1 hour',
        description: 'Identical requests are cached to reduce API calls',
      },
    },
    supportedCountries: ['US'],
    example: {
      request: {
        items: [
          {
            priceInCents: 1299,
            quantity: 1,
            deliveryType: 'digital',
            description: 'Santa Letter - Digital',
          },
        ],
        billingAddress: {
          line1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip: '94102',
          country: 'US',
        },
        shippingCostCents: 0,
      },
    },
  });
}
