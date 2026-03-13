'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get('session_id');
    setSessionId(id);

    if (id) {
      clearCart().catch((err) => {
        console.error('Failed to clear cart:', err);
      });
      setIsLoading(false);
    } else {
      setError('No session ID found');
      setIsLoading(false);
    }
  }, [searchParams, clearCart]);

  if (isLoading) {
    return (
      <div className="success-page">
        <div className="success-container">
          <div className="loading-state">
            <div className="spinner" />
            <p>Processing your order...</p>
          </div>
        </div>
        <style jsx>{`
          .success-page {
            min-height: calc(100vh - 64px);
            background: var(--bg);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 3rem 2rem;
          }

          .success-container {
            max-width: 600px;
            text-align: center;
          }

          .loading-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
            color: var(--text-dim);
          }

          .spinner {
            width: 48px;
            height: 48px;
            border: 3px solid var(--divider);
            border-top-color: var(--gold);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (error || !sessionId) {
    return (
      <div className="success-page">
        <div className="success-container">
          <div className="error-state">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="error-icon"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <h1>Something went wrong</h1>
            <p>{error || 'Invalid checkout session'}</p>
            <Link href="/" className="btn-primary">
              Return Home
            </Link>
          </div>
        </div>
        <style jsx>{`
          .success-page {
            min-height: calc(100vh - 64px);
            background: var(--bg);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 3rem 2rem;
          }

          .success-container {
            max-width: 600px;
            text-align: center;
          }

          .error-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
          }

          .error-icon {
            color: #c0392b;
          }

          h1 {
            font-family: 'Cinzel', serif;
            font-size: 2rem;
            color: var(--text);
            margin: 0;
          }

          p {
            font-size: 1.1rem;
            color: var(--text-dim);
            margin: 0;
          }

          .btn-primary {
            font-family: 'Cinzel', serif;
            font-size: 0.75rem;
            letter-spacing: 0.15em;
            text-transform: uppercase;
            background: var(--accent);
            color: #fff;
            border: none;
            padding: 1rem 2rem;
            cursor: pointer;
            transition: all 0.25s;
            border-radius: 2px;
            text-decoration: none;
            display: inline-block;
            margin-top: 1rem;
          }

          .btn-primary:hover {
            filter: brightness(1.15);
            transform: translateY(-1px);
            box-shadow: 0 4px 16px var(--accent-glow);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="success-page">
      <div className="success-container">
        <div className="success-content">
          <div className="success-icon-wrapper">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="success-icon"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <h1 className="success-title">Order Confirmed!</h1>
          <p className="success-message">
            Thank you for your purchase. Your order has been successfully processed.
          </p>

          <div className="info-card">
            <div className="info-row">
              <span className="info-label">Order ID</span>
              <span className="info-value">{sessionId.slice(-12).toUpperCase()}</span>
            </div>
          </div>

          <div className="next-steps">
            <h2 className="steps-title">What happens next?</h2>
            <ul className="steps-list">
              <li>
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
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>
                  You'll receive an order confirmation email with details and next steps
                </span>
              </li>
              <li>
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>
                  Check your email for a unique claim link to personalize your letter
                </span>
              </li>
              <li>
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
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                <span>
                  Your personalized letter will be generated and delivered as specified
                </span>
              </li>
            </ul>
          </div>

          <div className="action-buttons">
            <Link href="/" className="btn-primary">
              Continue Shopping
            </Link>
            <Link href="/track" className="btn-secondary">
              Track Your Order
            </Link>
          </div>

          <div className="help-text">
            <p>
              Need help? Contact us at{' '}
              <a href="mailto:support@northstarpostal.com">
                support@northstarpostal.com
              </a>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .success-page {
          min-height: calc(100vh - 64px);
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
        }

        .success-container {
          max-width: 700px;
          width: 100%;
        }

        .success-content {
          background: var(--bg-card);
          border: 1px solid var(--divider);
          border-radius: 4px;
          padding: 3rem;
          text-align: center;
        }

        .success-icon-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .success-icon {
          color: #27ae60;
          animation: scaleIn 0.5s ease;
        }

        @keyframes scaleIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .success-title {
          font-family: 'Cinzel', serif;
          font-size: 2.5rem;
          letter-spacing: 0.05em;
          color: var(--gold);
          margin: 0 0 1rem;
        }

        .success-message {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.2rem;
          color: var(--text);
          margin: 0 0 2.5rem;
          line-height: 1.6;
        }

        .info-card {
          background: var(--bg);
          border: 1px solid var(--divider);
          border-radius: 4px;
          padding: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .info-label {
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-dim);
        }

        .info-value {
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          color: var(--gold);
          font-weight: 500;
        }

        .next-steps {
          text-align: left;
          margin-bottom: 2.5rem;
        }

        .steps-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          color: var(--text);
          margin: 0 0 1.5rem;
          text-align: center;
        }

        .steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .steps-list li {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          font-size: 1rem;
          color: var(--text);
          line-height: 1.6;
        }

        .steps-list li svg {
          flex-shrink: 0;
          color: var(--gold);
          margin-top: 0.15rem;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .btn-primary,
        .btn-secondary {
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          padding: 1rem 2rem;
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.25s;
          text-decoration: none;
          display: inline-block;
        }

        .btn-primary {
          background: var(--accent);
          color: #fff;
          border: none;
        }

        .btn-primary:hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px var(--accent-glow);
        }

        .btn-secondary {
          background: transparent;
          color: var(--text-dim);
          border: 1px solid var(--divider);
        }

        .btn-secondary:hover {
          border-color: var(--gold);
          color: var(--gold);
        }

        .help-text {
          padding-top: 2rem;
          border-top: 1px solid var(--divider);
        }

        .help-text p {
          font-size: 0.9rem;
          color: var(--text-dim);
          margin: 0;
        }

        .help-text a {
          color: var(--gold);
          text-decoration: none;
          transition: color 0.2s;
        }

        .help-text a:hover {
          color: var(--gold-light);
        }

        @media (max-width: 768px) {
          .success-content {
            padding: 2rem 1.5rem;
          }

          .success-title {
            font-size: 2rem;
          }

          .success-message {
            font-size: 1.1rem;
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid var(--divider)',
          borderTopColor: 'var(--gold)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
