'use client';

import React, { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import Link from 'next/link';

export default function CheckoutPage() {
  const { cart, isLoading } = useCart();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('cartSessionId');
    setSessionId(id);
  }, []);

  if (isLoading || !sessionId) {
    return null;
  }

  if (!cart || cart.items.length === 0) {
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-header">
          <Link href="/" className="back-link">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back to Shopping</span>
          </Link>
          <h1 className="page-title">Checkout</h1>
          <p className="page-subtitle">
            Complete your order in just a few simple steps
          </p>
        </div>

        <div className="checkout-grid">
          <div className="checkout-main">
            <CheckoutForm cart={cart} sessionId={sessionId} />
          </div>

          <div className="checkout-sidebar">
            <OrderSummary cart={cart} shippingMethod={null} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .checkout-page {
          min-height: calc(100vh - 64px);
          background: var(--bg);
          padding: 3rem 0;
        }

        .checkout-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        .checkout-header {
          margin-bottom: 3rem;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-dim);
          text-decoration: none;
          transition: color 0.2s;
          margin-bottom: 1.5rem;
        }

        .back-link:hover {
          color: var(--gold);
        }

        .page-title {
          font-family: 'Cinzel', serif;
          font-size: 2.5rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          color: var(--gold);
          margin: 0 0 0.5rem;
        }

        .page-subtitle {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          color: var(--text-dim);
          margin: 0;
        }

        .checkout-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 3rem;
          align-items: start;
        }

        .checkout-main {
          background: var(--bg-card);
          border: 1px solid var(--divider);
          border-radius: 4px;
          padding: 2.5rem;
        }

        .checkout-sidebar {
          position: sticky;
          top: 80px;
        }

        @media (max-width: 1200px) {
          .checkout-grid {
            grid-template-columns: 1fr 350px;
            gap: 2rem;
          }
        }

        @media (max-width: 1024px) {
          .checkout-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .checkout-sidebar {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .checkout-page {
            padding: 2rem 0;
          }

          .checkout-container {
            padding: 0 1rem;
          }

          .checkout-header {
            margin-bottom: 2rem;
          }

          .page-title {
            font-size: 2rem;
          }

          .checkout-main {
            padding: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .checkout-page {
            padding: 1.5rem 0;
          }

          .page-title {
            font-size: 1.75rem;
          }

          .checkout-main {
            padding: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
