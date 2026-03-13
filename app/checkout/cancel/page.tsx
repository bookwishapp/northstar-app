'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';

export default function CheckoutCancelPage() {
  const [mounted, setMounted] = useState(false);
  const { cart, itemCount } = useCart();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '500px',
        margin: '0 auto',
      }}>
        {/* Cancel Icon */}
        <div style={{
          fontSize: '4rem',
          marginBottom: '1.5rem',
          color: 'var(--text-dim)',
        }}>
          ↩
        </div>

        {/* Title */}
        <h1 style={{
          fontFamily: 'Cinzel, serif',
          fontSize: '2rem',
          marginBottom: '1rem',
          color: 'var(--text)',
        }}>
          Payment Cancelled
        </h1>

        {/* Message */}
        <p style={{
          fontSize: '1.1rem',
          color: 'var(--text-dim)',
          marginBottom: '2rem',
          lineHeight: '1.6',
        }}>
          Your payment was cancelled and no charges were made. Your cart items have been preserved.
        </p>

        {itemCount > 0 && (
          <p style={{
            fontSize: '1rem',
            color: 'var(--text-dim)',
            marginBottom: '2rem',
          }}>
            You still have {itemCount} item{itemCount !== 1 ? 's' : ''} in your cart.
          </p>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <Link
            href="/cart"
            style={{
              padding: '0.75rem 2rem',
              background: 'var(--accent)',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '3px',
              fontFamily: 'Cinzel, serif',
              fontSize: '0.9rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              transition: 'all 0.3s ease',
              border: '1px solid var(--accent)',
              display: 'inline-block',
            }}
          >
            Return to Cart
          </Link>

          <Link
            href="/"
            style={{
              padding: '0.75rem 2rem',
              background: 'transparent',
              color: 'var(--text)',
              textDecoration: 'none',
              borderRadius: '3px',
              fontFamily: 'Cinzel, serif',
              fontSize: '0.9rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              transition: 'all 0.3s ease',
              border: '1px solid var(--divider)',
              display: 'inline-block',
            }}
          >
            Continue Shopping
          </Link>
        </div>

        {/* Help Section */}
        <div style={{
          marginTop: '3rem',
          padding: '1.5rem',
          background: 'var(--bg-card)',
          borderRadius: '8px',
          border: '1px solid var(--divider)',
        }}>
          <h3 style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '1rem',
            marginBottom: '0.5rem',
            color: 'var(--text)',
          }}>
            Need Help?
          </h3>
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--text-dim)',
            marginBottom: '0.5rem',
          }}>
            If you experienced any issues during checkout, please contact us:
          </p>
          <a
            href="mailto:support@northstarpostal.com"
            style={{
              color: 'var(--gold)',
              textDecoration: 'none',
              fontSize: '0.9rem',
            }}
          >
            support@northstarpostal.com
          </a>
        </div>
      </div>
    </div>
  );
}