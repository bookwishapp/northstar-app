'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartWithItems } from '@/lib/cart';

interface CartContextType {
  cart: CartWithItems | null;
  isLoading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (programId: string, deliveryType: 'digital' | 'physical', quantity?: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Generate or retrieve session ID
  useEffect(() => {
    let id = localStorage.getItem('cartSessionId');
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('cartSessionId', id);
    }
    setSessionId(id);
  }, []);

  // Fetch cart on mount and when session ID changes
  const refreshCart = useCallback(async () => {
    if (!sessionId) return;

    try {
      setIsLoading(true);
      const response = await fetch('/api/cart', {
        method: 'GET',
        headers: {
          'X-Session-ID': sessionId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data.cart);
      } else {
        console.error('Failed to fetch cart');
        setCart(null);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      refreshCart();
    }
  }, [sessionId, refreshCart]);

  // Cart drawer controls
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  // Add item to cart
  const addItem = useCallback(
    async (programId: string, deliveryType: 'digital' | 'physical', quantity: number = 1) => {
      if (!sessionId) return;

      try {
        const response = await fetch('/api/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId,
          },
          body: JSON.stringify({ programId, deliveryType, quantity }),
        });

        if (response.ok) {
          const data = await response.json();
          setCart(data.cart);
          openCart(); // Auto-open cart when item is added
        } else {
          const error = await response.json();
          console.error('Failed to add item to cart:', error);
          throw new Error(error.error || 'Failed to add item to cart');
        }
      } catch (error) {
        console.error('Error adding item to cart:', error);
        throw error;
      }
    },
    [sessionId, openCart]
  );

  // Update item quantity
  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      if (!sessionId) return;

      try {
        const response = await fetch('/api/cart', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId,
          },
          body: JSON.stringify({ itemId, quantity }),
        });

        if (response.ok) {
          const data = await response.json();
          setCart(data.cart);
        } else {
          const error = await response.json();
          console.error('Failed to update item quantity:', error);
          throw new Error(error.error || 'Failed to update quantity');
        }
      } catch (error) {
        console.error('Error updating item quantity:', error);
        throw error;
      }
    },
    [sessionId]
  );

  // Remove item from cart
  const removeItem = useCallback(
    async (itemId: string) => {
      if (!sessionId) return;

      try {
        const response = await fetch('/api/cart', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-ID': sessionId,
          },
          body: JSON.stringify({ itemId }),
        });

        if (response.ok) {
          const data = await response.json();
          setCart(data.cart);
        } else {
          const error = await response.json();
          console.error('Failed to remove item from cart:', error);
          throw new Error(error.error || 'Failed to remove item');
        }
      } catch (error) {
        console.error('Error removing item from cart:', error);
        throw error;
      }
    },
    [sessionId]
  );

  // Clear entire cart
  const clearCart = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/cart/clear', {
        method: 'POST',
        headers: {
          'X-Session-ID': sessionId,
        },
      });

      if (response.ok) {
        setCart(null);
        closeCart();
      } else {
        const error = await response.json();
        console.error('Failed to clear cart:', error);
        throw new Error(error.error || 'Failed to clear cart');
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw error;
    }
  }, [sessionId, closeCart]);

  // Calculate totals
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const subtotal = cart?.items.reduce((sum, item) => {
    const price =
      item.deliveryType === 'digital'
        ? item.program.priceDigital || 0
        : item.program.pricePhysical || 0;
    return sum + price * item.quantity;
  }, 0) || 0;

  const value: CartContextType = {
    cart,
    isLoading,
    isOpen,
    openCart,
    closeCart,
    toggleCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    refreshCart,
    itemCount,
    subtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
