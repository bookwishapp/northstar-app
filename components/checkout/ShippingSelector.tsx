'use client';

import React from 'react';

export type ShippingMethod = 'first_class' | 'priority';

interface ShippingOption {
  id: ShippingMethod;
  name: string;
  description: string;
  basePrice: number;
  additionalPrice: number;
  estimatedDays: string;
}

interface ShippingSelectorProps {
  selected: ShippingMethod | null;
  onSelect: (method: ShippingMethod) => void;
  itemCount: number;
}

const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: 'first_class',
    name: 'First Class Mail',
    description: 'Standard delivery',
    basePrice: 5.49,
    additionalPrice: 2.49,
    estimatedDays: '3-5 business days',
  },
  {
    id: 'priority',
    name: 'Priority Mail',
    description: 'Faster delivery',
    basePrice: 9.99,
    additionalPrice: 4.99,
    estimatedDays: '1-3 business days',
  },
];

export function calculateShippingCost(
  method: ShippingMethod,
  itemCount: number
): number {
  const option = SHIPPING_OPTIONS.find((opt) => opt.id === method);
  if (!option || itemCount === 0) return 0;

  return option.basePrice + option.additionalPrice * Math.max(0, itemCount - 1);
}

export default function ShippingSelector({
  selected,
  onSelect,
  itemCount,
}: ShippingSelectorProps) {
  return (
    <div className="shipping-selector">
      <h3 className="shipping-title">Shipping Method</h3>
      <p className="shipping-subtitle">
        Select your preferred shipping speed
      </p>

      <div className="shipping-options">
        {SHIPPING_OPTIONS.map((option) => {
          const cost = calculateShippingCost(option.id, itemCount);
          const isSelected = selected === option.id;

          return (
            <button
              key={option.id}
              type="button"
              className={`shipping-option ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(option.id)}
            >
              <div className="option-header">
                <div className="option-radio">
                  <div className={`radio-outer ${isSelected ? 'checked' : ''}`}>
                    {isSelected && <div className="radio-inner" />}
                  </div>
                </div>
                <div className="option-info">
                  <div className="option-name">{option.name}</div>
                  <div className="option-description">{option.description}</div>
                </div>
                <div className="option-price">${cost.toFixed(2)}</div>
              </div>
              <div className="option-details">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: '0.5rem' }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{option.estimatedDays}</span>
              </div>
              {itemCount > 1 && (
                <div className="option-breakdown">
                  ${option.basePrice.toFixed(2)} base + $
                  {option.additionalPrice.toFixed(2)} × {itemCount - 1} additional
                  {itemCount - 1 > 1 ? ' items' : ' item'}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <style jsx>{`
        .shipping-selector {
          margin-bottom: 2rem;
        }

        .shipping-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          font-weight: 500;
          color: var(--text);
          margin: 0 0 0.25rem;
        }

        .shipping-subtitle {
          font-size: 0.9rem;
          color: var(--text-dim);
          margin: 0 0 1.25rem;
        }

        .shipping-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .shipping-option {
          width: 100%;
          text-align: left;
          background: var(--bg-card);
          border: 2px solid var(--divider);
          border-radius: 4px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .shipping-option:hover {
          border-color: var(--gold);
          background: var(--bg-mid);
        }

        .shipping-option.selected {
          border-color: var(--gold);
          background: var(--bg-mid);
          box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.1);
        }

        .option-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .option-radio {
          flex-shrink: 0;
        }

        .radio-outer {
          width: 20px;
          height: 20px;
          border: 2px solid var(--divider);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .radio-outer.checked {
          border-color: var(--gold);
        }

        .radio-inner {
          width: 10px;
          height: 10px;
          background: var(--gold);
          border-radius: 50%;
          animation: scaleIn 0.2s ease;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        .option-info {
          flex: 1;
        }

        .option-name {
          font-family: 'Cinzel', serif;
          font-size: 0.9rem;
          letter-spacing: 0.05em;
          color: var(--text);
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .option-description {
          font-size: 0.85rem;
          color: var(--text-dim);
        }

        .option-price {
          font-family: 'Cinzel', serif;
          font-size: 1.1rem;
          color: var(--gold);
          font-weight: 500;
        }

        .option-details {
          display: flex;
          align-items: center;
          font-size: 0.85rem;
          color: var(--text-dim);
          padding-left: 2.25rem;
        }

        .option-breakdown {
          font-size: 0.75rem;
          color: var(--text-dim);
          font-style: italic;
          padding-left: 2.25rem;
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .option-header {
            flex-wrap: wrap;
          }

          .option-price {
            width: 100%;
            text-align: left;
            padding-left: 2.25rem;
          }
        }
      `}</style>
    </div>
  );
}
