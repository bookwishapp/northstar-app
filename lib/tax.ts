import Stripe from 'stripe';
import { getStripeServer } from './stripe';

/**
 * Tax Integration for North Star Postal using Stripe Tax
 *
 * This module provides utilities for calculating, formatting, and managing
 * sales tax for orders through Stripe's automatic tax calculation.
 */

/**
 * Address for tax calculation
 */
export interface TaxAddress {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
}

/**
 * Cart item for tax calculation
 */
export interface TaxCartItem {
  priceInCents: number;
  quantity: number;
  taxCode?: string; // Stripe tax code (e.g., 'txcd_99999999' for digital goods)
  description?: string;
}

/**
 * Tax jurisdiction details
 */
export interface TaxJurisdiction {
  country: string;
  state?: string;
  county?: string;
  city?: string;
  displayName: string;
}

/**
 * Tax calculation result
 */
export interface TaxCalculation {
  taxAmount: number; // Tax amount in dollars
  taxAmountCents: number; // Tax amount in cents
  taxRate: number; // Decimal tax rate (e.g., 0.0875 for 8.75%)
  taxRateDisplay: string; // Formatted tax rate (e.g., "8.75%")
  jurisdiction: TaxJurisdiction;
  subtotal: number; // Subtotal in dollars
  total: number; // Total including tax in dollars
  breakdown: TaxBreakdownItem[];
}

/**
 * Individual tax breakdown item
 */
export interface TaxBreakdownItem {
  amount: number;
  rate: number;
  rateDisplay: string;
  jurisdiction: string;
  taxabilityReason: string;
  taxableAmount: number;
}

/**
 * Options for configuring Stripe Tax settings
 */
export interface TaxSettingsOptions {
  defaultTaxCode?: string;
  headOfficeAddress?: TaxAddress;
}

/**
 * Tax codes for different product types
 * Reference: https://stripe.com/docs/tax/tax-codes
 */
export const TAX_CODES = {
  DIGITAL_GOODS: 'txcd_10000000', // General digital goods
  PHYSICAL_GOODS: 'txcd_99999999', // General tangible goods
  SHIPPING: 'txcd_92010001', // Shipping charges
  PRINTED_MATTER: 'txcd_30070000', // Printed books, newspapers, and periodicals
  GREETING_CARDS: 'txcd_99999999', // Physical greeting cards (general goods)
  DIGITAL_CONTENT: 'txcd_10103000', // Digital content/downloads
} as const;

/**
 * States that don't tax digital products
 * Note: This is for reference only - Stripe Tax handles the actual calculation
 */
export const STATES_NO_DIGITAL_TAX = [
  'AK', 'DE', 'MT', 'NH', 'OR', // No general sales tax
  'FL', // No digital goods tax as of 2024
];

/**
 * Determine if an address requires tax calculation
 *
 * @param address - Customer billing address
 * @returns True if tax calculation is required
 */
export function requiresTaxCalculation(address: TaxAddress): boolean {
  // Currently only supporting US tax calculation
  if (address.country !== 'US') {
    return false;
  }

  // Ensure we have minimum required address fields
  if (!address.state || !address.zip) {
    return false;
  }

  // All US addresses require tax calculation (Stripe will return 0 for non-taxable states)
  return true;
}

/**
 * Parse tax jurisdiction from Stripe Tax calculation response
 *
 * @param taxCalculation - Stripe tax calculation result
 * @returns Formatted jurisdiction details
 */
export function parseTaxJurisdiction(
  taxCalculation: Stripe.Tax.Calculation
): TaxJurisdiction {
  const breakdown = taxCalculation.tax_breakdown?.[0];

  if (!breakdown) {
    return {
      country: 'US',
      displayName: 'United States',
    };
  }

  const jurisdiction = (breakdown as any).jurisdiction;

  return {
    country: jurisdiction.country,
    state: jurisdiction.state ?? undefined,
    county: jurisdiction.county ?? undefined,
    city: jurisdiction.city ?? undefined,
    displayName: formatJurisdictionDisplay(jurisdiction),
  };
}

/**
 * Format jurisdiction for display
 *
 * @param jurisdiction - Stripe jurisdiction object
 * @returns Human-readable jurisdiction string
 */
function formatJurisdictionDisplay(jurisdiction: {
  country: string;
  state?: string | null;
  county?: string | null;
  city?: string | null;
}): string {
  const parts: string[] = [];

  if (jurisdiction.city) {
    parts.push(jurisdiction.city);
  }

  if (jurisdiction.county) {
    parts.push(`${jurisdiction.county} County`);
  }

  if (jurisdiction.state) {
    parts.push(jurisdiction.state);
  }

  if (parts.length > 0) {
    return parts.join(', ');
  }

  return jurisdiction.country;
}

/**
 * Format tax rate for display
 *
 * @param rate - Decimal tax rate (e.g., 0.0875)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string (e.g., "8.75%")
 */
export function formatTaxRate(rate: number, decimals: number = 2): string {
  const percentage = rate * 100;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format tax amount for display
 *
 * @param amountCents - Amount in cents
 * @returns Formatted currency string (e.g., "$8.75")
 */
export function formatTaxAmount(amountCents: number): string {
  const dollars = amountCents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

/**
 * Calculate tax-inclusive price from tax-exclusive price
 *
 * @param priceExcludingTax - Price without tax in dollars
 * @param taxRate - Decimal tax rate (e.g., 0.0875)
 * @returns Tax-inclusive price in dollars
 */
export function calculateTaxInclusive(
  priceExcludingTax: number,
  taxRate: number
): number {
  return priceExcludingTax * (1 + taxRate);
}

/**
 * Calculate tax-exclusive price from tax-inclusive price
 *
 * @param priceIncludingTax - Price with tax in dollars
 * @param taxRate - Decimal tax rate (e.g., 0.0875)
 * @returns Tax-exclusive price in dollars
 */
export function calculateTaxExclusive(
  priceIncludingTax: number,
  taxRate: number
): number {
  return priceIncludingTax / (1 + taxRate);
}

/**
 * Extract tax details from Stripe Checkout Session
 *
 * @param session - Stripe Checkout Session
 * @returns Tax details or null if not available
 */
export function extractTaxDetailsFromSession(
  session: Stripe.Checkout.Session
): {
  taxAmount: number;
  taxRate: number | null;
  jurisdiction: string | null;
} | null {
  if (!session.total_details?.amount_tax) {
    return null;
  }

  const taxAmountCents = session.total_details.amount_tax;
  const subtotalCents = (session.amount_subtotal ?? 0);

  const taxRate = subtotalCents > 0 ? taxAmountCents / subtotalCents : 0;

  return {
    taxAmount: taxAmountCents / 100,
    taxRate,
    jurisdiction: null, // Stripe Checkout doesn't expose jurisdiction
  };
}

/**
 * Calculate tax using Stripe Tax Calculation API
 *
 * @param items - Cart items for tax calculation
 * @param address - Customer billing address
 * @param shippingCostCents - Optional shipping cost in cents
 * @returns Tax calculation result
 */
export async function calculateTax(
  items: TaxCartItem[],
  address: TaxAddress,
  shippingCostCents?: number
): Promise<TaxCalculation> {
  const stripe = getStripeServer();

  // Build line items for Stripe Tax calculation
  const lineItems: Stripe.Tax.CalculationCreateParams.LineItem[] = items.map(
    (item, index) => ({
      amount: item.priceInCents * item.quantity,
      reference: `item_${index}`,
      tax_code: item.taxCode || TAX_CODES.PHYSICAL_GOODS,
    })
  );

  // Add shipping if provided
  if (shippingCostCents && shippingCostCents > 0) {
    lineItems.push({
      amount: shippingCostCents,
      reference: 'shipping',
      tax_code: TAX_CODES.SHIPPING,
    });
  }

  // Create tax calculation
  const calculation = await stripe.tax.calculations.create({
    currency: 'usd',
    line_items: lineItems,
    customer_details: {
      address: {
        line1: address.line1,
        line2: address.line2 || undefined,
        city: address.city,
        state: address.state,
        postal_code: address.zip,
        country: address.country,
      },
      address_source: 'billing',
    },
    expand: ['line_items.data.tax_breakdown'],
  });

  // Parse the response
  const taxAmountCents = calculation.tax_amount_exclusive;
  const subtotalCents = calculation.amount_total - taxAmountCents;
  const totalCents = calculation.amount_total;

  const taxRate = subtotalCents > 0 ? taxAmountCents / subtotalCents : 0;
  const jurisdiction = parseTaxJurisdiction(calculation);

  // Build breakdown
  const breakdown: TaxBreakdownItem[] = [];
  if (calculation.tax_breakdown && calculation.tax_breakdown.length > 0) {
    for (const item of calculation.tax_breakdown) {
      breakdown.push({
        amount: item.amount / 100,
        rate: item.tax_rate_details?.percentage_decimal
          ? (item.tax_rate_details.percentage_decimal as unknown as number) / 100
          : 0,
        rateDisplay: item.tax_rate_details?.percentage_decimal
          ? formatTaxRate((item.tax_rate_details.percentage_decimal as unknown as number) / 100)
          : '0%',
        jurisdiction: formatJurisdictionDisplay((item as any).jurisdiction),
        taxabilityReason: item.taxability_reason || 'standard_rate',
        taxableAmount: item.taxable_amount / 100,
      });
    }
  }

  return {
    taxAmount: taxAmountCents / 100,
    taxAmountCents,
    taxRate,
    taxRateDisplay: formatTaxRate(taxRate),
    jurisdiction,
    subtotal: subtotalCents / 100,
    total: totalCents / 100,
    breakdown,
  };
}

/**
 * Validate address for tax calculation
 *
 * @param address - Address to validate
 * @returns Validation result with errors if any
 */
export function validateTaxAddress(address: Partial<TaxAddress>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!address.line1 || address.line1.trim().length === 0) {
    errors.push('Street address is required');
  }

  if (!address.city || address.city.trim().length === 0) {
    errors.push('City is required');
  }

  if (!address.state || address.state.trim().length === 0) {
    errors.push('State is required');
  }

  if (!address.zip || address.zip.trim().length === 0) {
    errors.push('ZIP code is required');
  } else if (address.country === 'US') {
    // Validate US ZIP code format (5 digits or 5+4)
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(address.zip)) {
      errors.push('Invalid ZIP code format');
    }
  }

  if (!address.country || address.country.trim().length === 0) {
    errors.push('Country is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get tax code for delivery type
 *
 * @param deliveryType - 'digital' or 'physical'
 * @param isShipping - Whether this is a shipping charge
 * @returns Appropriate Stripe tax code
 */
export function getTaxCodeForDeliveryType(
  deliveryType: 'digital' | 'physical',
  isShipping: boolean = false
): string {
  if (isShipping) {
    return TAX_CODES.SHIPPING;
  }

  return deliveryType === 'digital'
    ? TAX_CODES.DIGITAL_GOODS
    : TAX_CODES.PHYSICAL_GOODS;
}

/**
 * Check if tax calculation is available for a country
 * Currently only US is supported
 *
 * @param countryCode - Two-letter country code
 * @returns True if tax calculation is available
 */
export function isTaxCalculationAvailable(countryCode: string): boolean {
  return countryCode === 'US';
}

/**
 * Configure Stripe Tax settings programmatically
 * Note: Most tax settings should be configured in the Stripe Dashboard
 * This function is for reference and specific programmatic needs
 *
 * @param options - Tax settings options
 */
export async function configureStripeTaxSettings(
  options: TaxSettingsOptions
): Promise<void> {
  const stripe = getStripeServer();

  // Update tax settings
  // Note: In production, tax settings are typically configured via Stripe Dashboard
  // This is mainly for testing or specific automated configuration needs

  if (options.headOfficeAddress) {
    // Register head office address for nexus determination
    // This would typically be done through the Stripe Dashboard
    console.log('Tax head office address should be configured in Stripe Dashboard:', {
      address: options.headOfficeAddress,
    });
  }

  if (options.defaultTaxCode) {
    console.log('Default tax code should be set per product in Stripe Dashboard:', {
      taxCode: options.defaultTaxCode,
    });
  }

  // In production, ensure these are configured:
  // 1. Enable automatic tax in Stripe Dashboard
  // 2. Configure your business location (nexus)
  // 3. Set up product tax codes for your products
  // 4. Configure tax registration numbers if required
}

/**
 * Format tax details for display in UI
 *
 * @param calculation - Tax calculation result
 * @returns Formatted tax details for display
 */
export function formatTaxDetailsForDisplay(calculation: TaxCalculation): {
  subtotal: string;
  tax: string;
  taxRate: string;
  total: string;
  jurisdiction: string;
} {
  return {
    subtotal: formatTaxAmount(calculation.subtotal * 100),
    tax: formatTaxAmount(calculation.taxAmountCents),
    taxRate: calculation.taxRateDisplay,
    total: formatTaxAmount(calculation.total * 100),
    jurisdiction: calculation.jurisdiction.displayName,
  };
}

/**
 * Round tax amount to avoid floating point issues
 *
 * @param amount - Amount to round
 * @returns Rounded amount to 2 decimal places
 */
export function roundTaxAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Calculate tax for multiple delivery types
 * Useful when cart has both digital and physical items
 *
 * @param digitalItems - Digital items
 * @param physicalItems - Physical items
 * @param address - Customer billing address
 * @param shippingCostCents - Shipping cost for physical items
 * @returns Combined tax calculation
 */
export async function calculateTaxForMixedCart(
  digitalItems: TaxCartItem[],
  physicalItems: TaxCartItem[],
  address: TaxAddress,
  shippingCostCents?: number
): Promise<TaxCalculation> {
  // Add tax codes to items
  const digitalItemsWithTaxCode = digitalItems.map(item => ({
    ...item,
    taxCode: TAX_CODES.DIGITAL_GOODS,
  }));

  const physicalItemsWithTaxCode = physicalItems.map(item => ({
    ...item,
    taxCode: TAX_CODES.PHYSICAL_GOODS,
  }));

  // Combine all items
  const allItems = [...digitalItemsWithTaxCode, ...physicalItemsWithTaxCode];

  // Calculate tax for combined cart
  return calculateTax(allItems, address, shippingCostCents);
}
