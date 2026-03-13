'use client';

import React, { useState } from 'react';
import { CartWithItems } from '@/lib/cart';
import { ShippingMethod } from './ShippingSelector';
import { calculateShippingCost } from './ShippingSelector';

interface OrderSummaryProps {
  cart: CartWithItems;
  shippingMethod: ShippingMethod | null;
  taxAmount?: number;
}

export default function OrderSummary({
  cart,
  shippingMethod,
  taxAmount = 0,
}: OrderSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const subtotal = cart.items.reduce((sum, item) => {
    const price =
      item.deliveryType === 'digital'
        ? item.program.priceDigital || 0
        : item.program.pricePhysical || 0;
    return sum + price * item.quantity;
  }, 0);

  const physicalItemCount = cart.items
    .filter((item) => item.deliveryType === 'physical')
    .reduce((sum, item) => sum + item.quantity, 0);

  const shippingCost =
    physicalItemCount > 0 && shippingMethod
      ? calculateShippingCost(shippingMethod, physicalItemCount)
      : 0;

  const total = subtotal + shippingCost + taxAmount;

  return (
    <div className="order-summary">
      <div className="summary-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h2 className="summary-title">Order Summary</h2>
        <button
          type="button"
          className="summary-toggle"
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      <div className={`summary-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="cart-items">
          {cart.items.map((item) => {
            const price =
              item.deliveryType === 'digital'
                ? item.program.priceDigital || 0
                : item.program.pricePhysical || 0;
            const itemTotal = price * item.quantity;

            return (
              <div key={item.id} className="summary-item">
                <div className="item-details">
                  <div className="item-name">{item.program.name}</div>
                  <div className="item-meta">
                    <span className="item-type">
                      {item.deliveryType === 'digital'
                        ? 'Digital'
                        : 'Physical'}{' '}
                      Delivery
                    </span>
                    <span className="item-quantity">Qty: {item.quantity}</span>
                  </div>
                </div>
                <div className="item-price">${itemTotal.toFixed(2)}</div>
              </div>
            );
          })}
        </div>

        <div className="summary-divider" />

        <div className="summary-totals">
          <div className="total-row">
            <span className="total-label">Subtotal</span>
            <span className="total-value">${subtotal.toFixed(2)}</span>
          </div>

          {physicalItemCount > 0 && (
            <div className="total-row">
              <span className="total-label">
                Shipping
                {!shippingMethod && (
                  <span className="total-note"> (Select method)</span>
                )}
              </span>
              <span className="total-value">
                {shippingMethod ? `$${shippingCost.toFixed(2)}` : '—'}
              </span>
            </div>
          )}

          <div className="total-row">
            <span className="total-label">
              Tax
              {taxAmount === 0 && (
                <span className="total-note"> (Calculated at payment)</span>
              )}
            </span>
            <span className="total-value">
              {taxAmount > 0 ? `$${taxAmount.toFixed(2)}` : '—'}
            </span>
          </div>

          <div className="summary-divider" />

          <div className="total-row total-row-final">
            <span className="total-label-final">Total</span>
            <span className="total-value-final">${total.toFixed(2)}</span>
          </div>
        </div>

        {physicalItemCount > 0 && (
          <div className="summary-note">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: '0.5rem', flexShrink: 0 }}
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>
              Your order contains {physicalItemCount} physical{' '}
              {physicalItemCount === 1 ? 'item' : 'items'} and will be shipped to
              your delivery address.
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        .order-summary {
          background: var(--bg-card);
          border: 1px solid var(--divider);
          border-radius: 4px;
          overflow: hidden;
          position: sticky;
          top: 80px;
        }

        .summary-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          cursor: pointer;
          user-select: none;
          border-bottom: 1px solid var(--divider);
        }

        .summary-title {
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--gold);
          margin: 0;
          font-weight: 500;
        }

        .summary-toggle {
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .summary-toggle:hover {
          color: var(--gold);
        }

        .summary-content {
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .summary-content.expanded {
          max-height: 2000px;
        }

        .summary-content.collapsed {
          max-height: 0;
        }

        .cart-items {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .summary-item {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
        }

        .item-details {
          flex: 1;
        }

        .item-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          font-weight: 500;
          color: var(--text);
          margin-bottom: 0.25rem;
        }

        .item-meta {
          display: flex;
          gap: 0.75rem;
          font-size: 0.8rem;
          color: var(--text-dim);
        }

        .item-type {
          font-family: 'Cinzel', serif;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-size: 0.7rem;
        }

        .item-quantity {
          font-family: 'Lato', sans-serif;
        }

        .item-price {
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          color: var(--text);
          font-weight: 500;
          white-space: nowrap;
        }

        .summary-divider {
          height: 1px;
          background: var(--divider);
          margin: 0 1.5rem;
        }

        .summary-totals {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .total-label {
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text-dim);
        }

        .total-note {
          font-family: 'Lato', sans-serif;
          font-size: 0.7rem;
          text-transform: none;
          font-style: italic;
          opacity: 0.8;
        }

        .total-value {
          font-family: 'Cinzel', serif;
          font-size: 0.95rem;
          color: var(--text);
        }

        .total-row-final {
          margin-top: 0.5rem;
        }

        .total-label-final {
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--gold);
          font-weight: 600;
        }

        .total-value-final {
          font-family: 'Cinzel', serif;
          font-size: 1.5rem;
          color: var(--gold);
          font-weight: 600;
        }

        .summary-note {
          display: flex;
          align-items: flex-start;
          padding: 1rem 1.5rem 1.5rem;
          font-size: 0.85rem;
          color: var(--text-dim);
          line-height: 1.5;
        }

        @media (max-width: 1024px) {
          .order-summary {
            position: static;
            margin-bottom: 2rem;
          }

          .summary-content.collapsed {
            max-height: 0;
          }
        }

        @media (max-width: 768px) {
          .summary-header {
            padding: 1rem;
          }

          .cart-items,
          .summary-totals {
            padding: 1rem;
          }

          .summary-note {
            padding: 0.75rem 1rem 1rem;
          }
        }
      `}</style>
    </div>
  );
}
