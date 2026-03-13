import { NextRequest, NextResponse } from 'next/server';
import {
  getOrCreateCart,
  addItemToCart,
  updateCartItemQuantity,
  removeCartItem,
} from '@/lib/cart';
import { z } from 'zod';

const addItemSchema = z.object({
  programId: z.string(),
  deliveryType: z.enum(['digital', 'physical']),
  quantity: z.number().int().positive().default(1),
});

const updateQuantitySchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().min(0),
});

const removeItemSchema = z.object({
  itemId: z.string(),
});

/**
 * Get session ID from request headers
 */
function getSessionId(request: NextRequest): string | null {
  return request.headers.get('X-Session-ID');
}

/**
 * GET /api/cart
 * Retrieve current cart
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = getSessionId(request);
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const cart = await getOrCreateCart(sessionId);

    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Failed to retrieve cart:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve cart' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 * Add item to cart
 */
export async function POST(request: NextRequest) {
  try {
    const sessionId = getSessionId(request);
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = addItemSchema.parse(body);

    const cart = await addItemToCart(
      sessionId,
      validatedData.programId,
      validatedData.deliveryType,
      validatedData.quantity
    );

    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Failed to add item to cart:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cart
 * Update cart item quantity
 */
export async function PATCH(request: NextRequest) {
  try {
    const sessionId = getSessionId(request);
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateQuantitySchema.parse(body);

    const cart = await updateCartItemQuantity(
      sessionId,
      validatedData.itemId,
      validatedData.quantity
    );

    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Failed to update cart item quantity:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Cart item not found') {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update cart item quantity' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart
 * Remove item from cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = getSessionId(request);
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = removeItemSchema.parse(body);

    const cart = await removeCartItem(sessionId, validatedData.itemId);

    return NextResponse.json({ cart });
  } catch (error) {
    console.error('Failed to remove cart item:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === 'Cart item not found') {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to remove cart item' },
      { status: 500 }
    );
  }
}
