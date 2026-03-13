import { prisma } from '@/lib/prisma';
import { Cart, CartItem, Program } from '@prisma/client';

export type CartWithItems = Cart & {
  items: (CartItem & {
    program: Program;
  })[];
};

/**
 * Get cart by session ID, including all items with program details
 */
export async function getCartBySessionId(sessionId: string): Promise<CartWithItems | null> {
  const cart = await prisma.cart.findUnique({
    where: { sessionId },
    include: {
      items: {
        include: {
          program: true,
        },
      },
    },
  });

  return cart;
}

/**
 * Create a new cart for a session
 */
export async function createCart(sessionId: string): Promise<Cart> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

  const cart = await prisma.cart.create({
    data: {
      sessionId,
      expiresAt,
    },
  });

  return cart;
}

/**
 * Get or create cart for a session
 */
export async function getOrCreateCart(sessionId: string): Promise<CartWithItems> {
  let cart = await getCartBySessionId(sessionId);

  if (!cart) {
    const newCart = await createCart(sessionId);
    cart = await getCartBySessionId(sessionId);
    if (!cart) {
      throw new Error('Failed to create cart');
    }
  }

  // Check if cart is expired
  if (cart.expiresAt < new Date()) {
    // Clear expired items and reset expiry
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + 24);

    await prisma.cart.update({
      where: { id: cart.id },
      data: { expiresAt: newExpiresAt },
    });

    cart = await getCartBySessionId(sessionId);
    if (!cart) {
      throw new Error('Failed to refresh cart');
    }
  }

  return cart;
}

/**
 * Add item to cart or update quantity if already exists
 */
export async function addItemToCart(
  sessionId: string,
  programId: string,
  deliveryType: 'digital' | 'physical',
  quantity: number = 1
): Promise<CartWithItems> {
  const cart = await getOrCreateCart(sessionId);

  // Check if item already exists in cart with same delivery type
  const existingItem = cart.items.find(
    (item) => item.programId === programId && item.deliveryType === deliveryType
  );

  if (existingItem) {
    // Update quantity
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  } else {
    // Create new cart item
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        programId,
        deliveryType,
        quantity,
      },
    });
  }

  // Return updated cart
  const updatedCart = await getCartBySessionId(sessionId);
  if (!updatedCart) {
    throw new Error('Failed to retrieve updated cart');
  }

  return updatedCart;
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(
  sessionId: string,
  itemId: string,
  quantity: number
): Promise<CartWithItems> {
  if (quantity <= 0) {
    return removeCartItem(sessionId, itemId);
  }

  const cart = await getOrCreateCart(sessionId);

  // Verify item belongs to this cart
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) {
    throw new Error('Cart item not found');
  }

  await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
  });

  // Return updated cart
  const updatedCart = await getCartBySessionId(sessionId);
  if (!updatedCart) {
    throw new Error('Failed to retrieve updated cart');
  }

  return updatedCart;
}

/**
 * Remove item from cart
 */
export async function removeCartItem(
  sessionId: string,
  itemId: string
): Promise<CartWithItems> {
  const cart = await getOrCreateCart(sessionId);

  // Verify item belongs to this cart
  const item = cart.items.find((i) => i.id === itemId);
  if (!item) {
    throw new Error('Cart item not found');
  }

  await prisma.cartItem.delete({
    where: { id: itemId },
  });

  // Return updated cart
  const updatedCart = await getCartBySessionId(sessionId);
  if (!updatedCart) {
    throw new Error('Failed to retrieve updated cart');
  }

  return updatedCart;
}

/**
 * Clear all items from cart
 */
export async function clearCart(sessionId: string): Promise<void> {
  const cart = await getCartBySessionId(sessionId);
  if (!cart) {
    return;
  }

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id },
  });
}

/**
 * Calculate cart totals
 */
export function calculateCartTotals(cart: CartWithItems): {
  subtotal: number;
  itemCount: number;
  totalItems: number;
} {
  let subtotal = 0;
  let totalItems = 0;

  cart.items.forEach((item) => {
    const price =
      item.deliveryType === 'digital'
        ? item.program.priceDigital || 0
        : item.program.pricePhysical || 0;

    subtotal += price * item.quantity;
    totalItems += item.quantity;
  });

  return {
    subtotal,
    itemCount: cart.items.length,
    totalItems,
  };
}

/**
 * Cleanup expired carts (run via cron job)
 */
export async function cleanupExpiredCarts(): Promise<number> {
  const result = await prisma.cart.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}
