'use client';

import React, { useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { cart, isLoading } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!cart || cart.items.length === 0)) {
      router.push('/');
    }
  }, [cart, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}>
        <div style={{
          textAlign: 'center',
          color: 'var(--text-dim)',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '3px solid var(--divider)',
            borderTopColor: 'var(--gold)',
            borderRadius: '50%',
            margin: '0 auto 1rem',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{
            fontFamily: 'Cinzel, serif',
            fontSize: '0.9rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>Loading checkout...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      paddingTop: '64px',
    }}>
      {children}
    </div>
  );
}
