'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

export default function CartDrawer() {
  const router = useRouter();
  const {
    cart,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    itemCount,
    subtotal,
  } = useCart();

  const handleCheckout = () => {
    closeCart();
    router.push('/checkout');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="cart-backdrop"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="cart-drawer">
        {/* Header */}
        <div className="cart-header">
          <h2 className="cart-title">Your Cart</h2>
          <button
            className="cart-close"
            onClick={closeCart}
            aria-label="Close cart"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="cart-content">
          {!cart || cart.items.length === 0 ? (
            <div className="cart-empty">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="cart-empty-icon"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <p className="cart-empty-text">Your cart is empty</p>
              <p className="cart-empty-subtext">
                Add some magical letters to get started
              </p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="cart-items">
                {cart.items.map((item) => {
                  const price =
                    item.deliveryType === 'digital'
                      ? item.program.priceDigital || 0
                      : item.program.pricePhysical || 0;

                  return (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-details">
                        <h3 className="cart-item-name">{item.program.name}</h3>
                        <p className="cart-item-type">
                          {item.deliveryType === 'digital'
                            ? 'Digital Delivery'
                            : 'Physical Delivery'}
                        </p>
                        <p className="cart-item-price">
                          ${price.toFixed(2)}
                        </p>
                      </div>

                      <div className="cart-item-actions">
                        <div className="cart-item-quantity">
                          <button
                            className="quantity-btn"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            disabled={item.quantity <= 1}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                          <span className="quantity-value">{item.quantity}</span>
                          <button
                            className="quantity-btn"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                          </button>
                        </div>

                        <button
                          className="cart-item-remove"
                          onClick={() => removeItem(item.id)}
                          aria-label="Remove item"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="cart-footer">
                <div className="cart-subtotal">
                  <span className="cart-subtotal-label">Subtotal</span>
                  <span className="cart-subtotal-value">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <p className="cart-footer-note">
                  Shipping and taxes calculated at checkout
                </p>
                <button className="cart-checkout-btn" onClick={handleCheckout}>
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .cart-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 998;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .cart-drawer {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          max-width: 420px;
          background: var(--bg-card);
          z-index: 999;
          display: flex;
          flex-direction: column;
          border-left: 1px solid var(--divider);
          box-shadow: -8px 0 32px rgba(0, 0, 0, 0.5);
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .cart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 1.5rem 1rem;
          border-bottom: 1px solid var(--divider);
        }

        .cart-title {
          font-family: 'Cinzel', serif;
          font-size: 1.25rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          color: var(--gold);
          margin: 0;
        }

        .cart-close {
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }

        .cart-close:hover {
          color: var(--gold);
        }

        .cart-content {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .cart-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          text-align: center;
        }

        .cart-empty-icon {
          color: var(--text-dim);
          opacity: 0.5;
          margin-bottom: 1.5rem;
        }

        .cart-empty-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          font-weight: 400;
          color: var(--text);
          margin: 0 0 0.5rem;
        }

        .cart-empty-subtext {
          font-size: 0.9rem;
          color: var(--text-dim);
          margin: 0;
          font-weight: 300;
        }

        .cart-items {
          flex: 1;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .cart-item {
          display: flex;
          gap: 1rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid var(--divider);
        }

        .cart-item:last-child {
          border-bottom: none;
        }

        .cart-item-details {
          flex: 1;
        }

        .cart-item-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          font-weight: 500;
          color: var(--text);
          margin: 0 0 0.25rem;
          line-height: 1.3;
        }

        .cart-item-type {
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin: 0 0 0.5rem;
        }

        .cart-item-price {
          font-family: 'Cinzel', serif;
          font-size: 1rem;
          color: var(--accent-2);
          margin: 0;
        }

        .cart-item-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.75rem;
        }

        .cart-item-quantity {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid var(--divider);
          border-radius: 2px;
          padding: 0.25rem;
        }

        .quantity-btn {
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

        .quantity-btn:hover:not(:disabled) {
          color: var(--gold);
        }

        .quantity-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .quantity-value {
          font-family: 'Cinzel', serif;
          font-size: 0.85rem;
          color: var(--text);
          min-width: 24px;
          text-align: center;
        }

        .cart-item-remove {
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

        .cart-item-remove:hover {
          color: #c0392b;
        }

        .cart-footer {
          border-top: 1px solid var(--divider);
          padding: 1.5rem;
          background: var(--bg);
        }

        .cart-subtotal {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .cart-subtotal-label {
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-dim);
        }

        .cart-subtotal-value {
          font-family: 'Cinzel', serif;
          font-size: 1.5rem;
          font-weight: 500;
          color: var(--gold);
        }

        .cart-footer-note {
          font-size: 0.75rem;
          color: var(--text-dim);
          margin: 0 0 1.25rem;
          text-align: center;
          font-style: italic;
        }

        .cart-checkout-btn {
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          background: var(--accent);
          color: #fff;
          border: none;
          padding: 1rem;
          width: 100%;
          cursor: pointer;
          transition: all 0.25s;
          border-radius: 2px;
        }

        .cart-checkout-btn:hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px var(--accent-glow);
        }

        @media (max-width: 480px) {
          .cart-drawer {
            max-width: 100%;
          }

          .cart-items {
            padding: 1rem;
          }

          .cart-footer {
            padding: 1rem;
          }
        }
      `}</style>
    </>
  );
}
