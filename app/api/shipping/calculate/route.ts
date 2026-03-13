/**
 * North Star Postal - Shipping Calculation API
 *
 * Endpoints:
 * - POST /api/shipping/calculate - Calculate shipping cost for cart
 * - GET /api/shipping/calculate - Get available shipping options
 *
 * This API handles shipping cost calculations for physical items in the cart.
 * Digital items do not require shipping and are excluded from calculations.
 *
 * POST Request Body:
 * {
 *   "method": "first_class" | "priority",
 *   "sessionId": "string" (optional if provided in X-Session-ID header)
 * }
 *
 * POST Response:
 * {
 *   "cost": number,
 *   "method": string,
 *   "methodDetails": ShippingOption,
 *   "estimatedDelivery": { min: Date, max: Date },
 *   "itemCount": number,
 *   "breakdown": { baseCost, additionalItemsCost, additionalItemsCount },
 *   "requiresShipping": boolean
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCartBySessionId } from '@/lib/cart';
import {
  calculateShipping,
  isValidShippingMethod,
  countPhysicalItems,
  cartNeedsShipping,
  getShippingOptions,
  type ShippingMethod,
} from '@/lib/shipping';

/**
 * Request validation schema
 */
const calculateShippingSchema = z.object({
  method: z.enum(['first_class', 'priority']),
  sessionId: z.string().optional(),
});

/**
 * Get session ID from request headers or body
 */
function getSessionId(request: NextRequest, body?: { sessionId?: string }): string | null {
  return body?.sessionId || request.headers.get('X-Session-ID');
}

/**
 * POST /api/shipping/calculate
 * Calculate shipping cost for cart
 *
 * Request body:
 * - method: 'first_class' | 'priority'
 * - sessionId: string (optional if provided in header)
 *
 * Returns:
 * - cost: number
 * - method: string
 * - methodDetails: ShippingOption
 * - estimatedDelivery: { min: Date, max: Date }
 * - itemCount: number
 * - breakdown: { baseCost, additionalItemsCost, additionalItemsCount }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = getSessionId(request, body);

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required in header (X-Session-ID) or request body' },
        { status: 400 }
      );
    }

    // Validate request data
    const validatedData = calculateShippingSchema.parse(body);
    const { method } = validatedData;

    // Get cart
    const cart = await getCartBySessionId(sessionId);
    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    // Check if cart has any items
    if (cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Check if cart has physical items
    if (!cartNeedsShipping(cart)) {
      return NextResponse.json(
        {
          message: 'Cart contains only digital items, no shipping required',
          cost: 0,
          itemCount: 0,
          requiresShipping: false,
        },
        { status: 200 }
      );
    }

    // Calculate shipping
    const calculation = calculateShipping(method, cart);
    const allOptions = getShippingOptions();
    const selectedOption = allOptions.find((opt) => opt.method === method);

    return NextResponse.json({
      cost: calculation.cost,
      method: calculation.method,
      methodDetails: selectedOption,
      estimatedDelivery: {
        min: calculation.estimatedDeliveryDate.min,
        max: calculation.estimatedDeliveryDate.max,
      },
      itemCount: calculation.itemCount,
      breakdown: calculation.breakdown,
      requiresShipping: true,
    });
  } catch (error) {
    console.error('Failed to calculate shipping:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    // Handle known errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid shipping method')) {
        return NextResponse.json(
          { error: 'Invalid shipping method. Must be "first_class" or "priority"' },
          { status: 400 }
        );
      }

      if (error.message.includes('no physical items')) {
        return NextResponse.json(
          {
            message: 'Cart contains only digital items, no shipping required',
            cost: 0,
            itemCount: 0,
            requiresShipping: false,
          },
          { status: 200 }
        );
      }
    }

    // Generic error
    return NextResponse.json(
      { error: 'Failed to calculate shipping cost' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/shipping/calculate
 * Get available shipping options
 *
 * Optionally provide sessionId to check if shipping is required
 *
 * Returns array of shipping options with:
 * - method: string
 * - name: string
 * - description: string
 * - baseCost: number
 * - additionalItemCost: number
 * - estimatedDays: { min: number, max: number }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || getSessionId(request);

    const options = getShippingOptions();

    // If sessionId provided, check if shipping is required
    if (sessionId) {
      const cart = await getCartBySessionId(sessionId);

      if (cart) {
        const physicalItemCount = countPhysicalItems(cart);
        const needsShipping = cartNeedsShipping(cart);

        return NextResponse.json({
          options,
          cartInfo: {
            physicalItemCount,
            requiresShipping: needsShipping,
            totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
          },
        });
      }
    }

    // Return just the options if no cart info
    return NextResponse.json({ options });
  } catch (error) {
    console.error('Failed to get shipping options:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve shipping options' },
      { status: 500 }
    );
  }
}
