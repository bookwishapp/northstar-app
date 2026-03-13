/**
 * North Star Postal - Shipping Calculator
 *
 * Provides utilities for calculating shipping costs, estimating delivery dates,
 * and managing shipping options for physical items.
 *
 * Shipping Rates:
 * - First Class Mail: $5.49 base + $2.49 per additional item (3-5 business days)
 * - Priority Mail: $9.99 base + $4.99 per additional item (1-3 business days)
 *
 * Features:
 * - Calculate shipping costs based on item count
 * - Estimate delivery dates (business days only)
 * - Determine if cart requires shipping
 * - Count physical items in cart
 * - Format costs and delivery estimates
 */

import { CartWithItems } from '@/lib/cart';

/**
 * Shipping method types
 */
export type ShippingMethod = 'first_class' | 'priority';

/**
 * Shipping option interface
 */
export interface ShippingOption {
  method: ShippingMethod;
  name: string;
  description: string;
  baseCost: number;
  additionalItemCost: number;
  estimatedDays: {
    min: number;
    max: number;
  };
}

/**
 * Shipping calculation result interface
 */
export interface ShippingCalculation {
  method: ShippingMethod;
  cost: number;
  estimatedDeliveryDate: {
    min: Date;
    max: Date;
  };
  itemCount: number;
  breakdown: {
    baseCost: number;
    additionalItemsCost: number;
    additionalItemsCount: number;
  };
}

/**
 * Shipping rate configuration
 */
const SHIPPING_RATES: Record<ShippingMethod, ShippingOption> = {
  first_class: {
    method: 'first_class',
    name: 'First Class Mail',
    description: 'Affordable shipping with delivery in 3-5 business days',
    baseCost: 5.49,
    additionalItemCost: 2.49,
    estimatedDays: { min: 3, max: 5 },
  },
  priority: {
    method: 'priority',
    name: 'Priority Mail',
    description: 'Fast shipping with delivery in 1-3 business days',
    baseCost: 9.99,
    additionalItemCost: 4.99,
    estimatedDays: { min: 1, max: 3 },
  },
};

/**
 * Calculate shipping cost based on method and item count
 *
 * @param method - Shipping method ('first_class' or 'priority')
 * @param itemCount - Total number of physical items
 * @returns Total shipping cost
 */
export function calculateShippingCost(
  method: ShippingMethod,
  itemCount: number
): number {
  if (itemCount <= 0) {
    return 0;
  }

  const rate = SHIPPING_RATES[method];
  if (!rate) {
    throw new Error(`Invalid shipping method: ${method}`);
  }

  const baseCost = rate.baseCost;
  const additionalItems = Math.max(0, itemCount - 1);
  const additionalCost = additionalItems * rate.additionalItemCost;

  return baseCost + additionalCost;
}

/**
 * Get all available shipping options
 *
 * @returns Array of shipping options with details
 */
export function getShippingOptions(): ShippingOption[] {
  return Object.values(SHIPPING_RATES);
}

/**
 * Get a specific shipping option by method
 *
 * @param method - Shipping method
 * @returns Shipping option details or null if not found
 */
export function getShippingOption(method: ShippingMethod): ShippingOption | null {
  return SHIPPING_RATES[method] || null;
}

/**
 * Calculate estimated delivery dates based on shipping method
 *
 * @param method - Shipping method
 * @param shipDate - Date when item will be shipped (defaults to today)
 * @returns Object with min and max estimated delivery dates
 */
export function estimateDeliveryDate(
  method: ShippingMethod,
  shipDate: Date = new Date()
): { min: Date; max: Date } {
  const rate = SHIPPING_RATES[method];
  if (!rate) {
    throw new Error(`Invalid shipping method: ${method}`);
  }

  const minDate = addBusinessDays(shipDate, rate.estimatedDays.min);
  const maxDate = addBusinessDays(shipDate, rate.estimatedDays.max);

  return { min: minDate, max: maxDate };
}

/**
 * Add business days to a date (excluding weekends)
 *
 * @param startDate - Starting date
 * @param businessDays - Number of business days to add
 * @returns New date with business days added
 */
function addBusinessDays(startDate: Date, businessDays: number): Date {
  const date = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < businessDays) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();

    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }

  return date;
}

/**
 * Count physical items in cart (items that require shipping)
 *
 * @param cart - Cart with items
 * @returns Total count of physical items
 */
export function countPhysicalItems(cart: CartWithItems): number {
  return cart.items
    .filter((item) => item.deliveryType === 'physical')
    .reduce((total, item) => total + item.quantity, 0);
}

/**
 * Check if cart has any physical items that need shipping
 *
 * @param cart - Cart with items
 * @returns True if cart has physical items
 */
export function cartNeedsShipping(cart: CartWithItems): boolean {
  return cart.items.some((item) => item.deliveryType === 'physical');
}

/**
 * Calculate complete shipping details for a cart
 *
 * @param method - Shipping method
 * @param cart - Cart with items
 * @returns Complete shipping calculation details
 */
export function calculateShipping(
  method: ShippingMethod,
  cart: CartWithItems
): ShippingCalculation {
  const itemCount = countPhysicalItems(cart);

  if (itemCount === 0) {
    throw new Error('Cart has no physical items requiring shipping');
  }

  const rate = SHIPPING_RATES[method];
  if (!rate) {
    throw new Error(`Invalid shipping method: ${method}`);
  }

  const additionalItemsCount = Math.max(0, itemCount - 1);
  const baseCost = rate.baseCost;
  const additionalItemsCost = additionalItemsCount * rate.additionalItemCost;
  const totalCost = baseCost + additionalItemsCost;

  const deliveryEstimate = estimateDeliveryDate(method);

  return {
    method,
    cost: totalCost,
    estimatedDeliveryDate: deliveryEstimate,
    itemCount,
    breakdown: {
      baseCost,
      additionalItemsCost,
      additionalItemsCount,
    },
  };
}

/**
 * Validate shipping method
 *
 * @param method - Method to validate
 * @returns True if valid
 */
export function isValidShippingMethod(method: string): method is ShippingMethod {
  return method === 'first_class' || method === 'priority';
}

/**
 * Format shipping cost as currency string
 *
 * @param cost - Cost in dollars
 * @returns Formatted currency string
 */
export function formatShippingCost(cost: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cost);
}

/**
 * Format delivery estimate as readable string
 *
 * @param min - Minimum delivery date
 * @param max - Maximum delivery date
 * @returns Formatted date range string
 */
export function formatDeliveryEstimate(min: Date, max: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };

  const minStr = min.toLocaleDateString('en-US', options);
  const maxStr = max.toLocaleDateString('en-US', options);

  // If same year, don't repeat it
  if (min.getFullYear() === max.getFullYear()) {
    return `${minStr} - ${maxStr}`;
  }

  return `${minStr}, ${min.getFullYear()} - ${maxStr}, ${max.getFullYear()}`;
}
