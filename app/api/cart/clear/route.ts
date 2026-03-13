import { NextRequest, NextResponse } from 'next/server';
import { clearCart } from '@/lib/cart';

/**
 * POST /api/cart/clear
 * Clear all items from cart
 */
export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('X-Session-ID');
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    await clearCart(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to clear cart:', error);
    return NextResponse.json(
      { error: 'Failed to clear cart' },
      { status: 500 }
    );
  }
}
