'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Order, Program, Holiday } from '@prisma/client';

interface OrderWithProgram extends Order {
  program: (Program & {
    holiday: Holiday | null;
  }) | null;
}

interface OrderDetailsProps {
  order: OrderWithProgram;
}

export default function OrderDetailsComponent({ order }: OrderDetailsProps) {
  const [copied, setCopied] = useState(false);

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed':
      case 'claimed':
        return '#22c55e';
      case 'processing':
      case 'pending_claim':
      case 'pending_delivery':
        return '#f59e0b';
      case 'cancelled':
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getPaymentStatusColor = (status: string | null) => {
    switch (status) {
      case 'paid':
        return '#22c55e';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const billingAddress = order.billingAddress as any;
  const shippingAddress = order.recipientAddress as any;

  return (
    <div className="order-details-page">
      <div className="container">
        <Link href="/track" className="back-link">
          ← Back to Order Tracking
        </Link>

        <div className="order-header">
          <h1>Order Details</h1>
          <div className="order-id" onClick={copyOrderId}>
            <span>Order ID: {order.id}</span>
            <button className="copy-btn">
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="order-grid">
          {/* Order Status Card */}
          <div className="card status-card">
            <h2>Order Status</h2>
            <div className="status-content">
              <div className="status-badge" style={{ backgroundColor: getStatusColor(order.status) }}>
                {order.status?.replace(/_/g, ' ').toUpperCase() || 'PENDING'}
              </div>
              <div className="status-details">
                <div className="detail-row">
                  <span>Payment Status:</span>
                  <span className="payment-status" style={{ color: getPaymentStatusColor(order.paymentStatus) }}>
                    {order.paymentStatus?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
                <div className="detail-row">
                  <span>Placed:</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                {order.paidAt && (
                  <div className="detail-row">
                    <span>Paid:</span>
                    <span>{formatDate(order.paidAt)}</span>
                  </div>
                )}
                {order.claimedAt && (
                  <div className="detail-row">
                    <span>Claimed:</span>
                    <span>{formatDate(order.claimedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Details Card */}
          {order.program && (
            <div className="card product-card">
              <h2>Product Details</h2>
              <div className="product-content">
                <h3>{order.program.name}</h3>
                {order.program.holiday && (
                  <p className="holiday-badge">{order.program.holiday.name}</p>
                )}
                <div className="product-details">
                  <div className="detail-row">
                    <span>Type:</span>
                    <span className="delivery-type">
                      {order.deliveryType === 'digital' ? 'Digital Delivery' : 'Physical Letter'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span>Price:</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Card */}
          <div className="card pricing-card">
            <h2>Order Summary</h2>
            <div className="pricing-content">
              <div className="price-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.shippingCost && order.shippingCost > 0 && (
                <div className="price-row">
                  <span>Shipping ({order.shippingMethod}):</span>
                  <span>{formatCurrency(order.shippingCost)}</span>
                </div>
              )}
              {order.taxAmount && order.taxAmount > 0 && (
                <div className="price-row">
                  <span>Tax:</span>
                  <span>{formatCurrency(order.taxAmount)}</span>
                </div>
              )}
              <div className="price-row total">
                <span>Total:</span>
                <span>{formatCurrency(order.totalAmount || order.subtotal)}</span>
              </div>
            </div>
          </div>

          {/* Customer Information Card */}
          <div className="card customer-card">
            <h2>Customer Information</h2>
            <div className="customer-content">
              <div className="detail-row">
                <span>Name:</span>
                <span>{order.customerName || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span>Email:</span>
                <span>{order.customerEmail}</span>
              </div>
              {order.recipientName && (
                <div className="detail-row">
                  <span>Recipient:</span>
                  <span>{order.recipientName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Billing Address Card */}
          {billingAddress && (
            <div className="card address-card">
              <h2>Billing Address</h2>
              <div className="address-content">
                <p>{billingAddress.name}</p>
                <p>{billingAddress.line1}</p>
                {billingAddress.line2 && <p>{billingAddress.line2}</p>}
                <p>
                  {billingAddress.city}, {billingAddress.state} {billingAddress.zip}
                </p>
                <p>{billingAddress.country}</p>
              </div>
            </div>
          )}

          {/* Shipping Address Card */}
          {shippingAddress && order.deliveryType === 'physical' && (
            <div className="card address-card">
              <h2>Shipping Address</h2>
              <div className="address-content">
                <p>{shippingAddress.name}</p>
                <p>{shippingAddress.line1}</p>
                {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                <p>
                  {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zip}
                </p>
                <p>{shippingAddress.country}</p>
              </div>
            </div>
          )}

          {/* Payment Information Card */}
          {order.stripeSessionId && (
            <div className="card payment-card">
              <h2>Payment Information</h2>
              <div className="payment-content">
                <div className="detail-row">
                  <span>Method:</span>
                  <span>Credit/Debit Card</span>
                </div>
                <div className="detail-row">
                  <span>Session ID:</span>
                  <span className="mono">{order.stripeSessionId.slice(0, 20)}...</span>
                </div>
                {order.stripePaymentIntentId && (
                  <div className="detail-row">
                    <span>Payment ID:</span>
                    <span className="mono">{order.stripePaymentIntentId.slice(0, 20)}...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions Card */}
          {order.status === 'pending_claim' && (
            <div className="card actions-card">
              <h2>Actions</h2>
              <div className="actions-content">
                <p>Check your email for the claim link to customize your letter!</p>
                <Link href="/track" className="action-btn">
                  Track Another Order
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .order-details-page {
          min-height: 100vh;
          background: var(--bg);
          padding: 2rem;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          color: var(--gold);
          text-decoration: none;
          margin-bottom: 2rem;
          font-size: 0.9rem;
          transition: opacity 0.2s;
        }

        .back-link:hover {
          opacity: 0.8;
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        h1 {
          font-family: 'Cinzel', serif;
          font-size: 2rem;
          color: var(--text);
          margin: 0;
        }

        .order-id {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--bg-card);
          border: 1px solid var(--divider);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .order-id:hover {
          background: var(--bg-hover);
        }

        .order-id span {
          font-family: monospace;
          font-size: 0.85rem;
          color: var(--text-dim);
        }

        .copy-btn {
          padding: 0.25rem 0.5rem;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .copy-btn:hover {
          background: var(--accent-hover);
        }

        .order-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .card {
          background: var(--bg-card);
          border: 1px solid var(--divider);
          border-radius: 12px;
          padding: 1.5rem;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }

        h2 {
          font-family: 'Cinzel', serif;
          font-size: 1.2rem;
          color: var(--text);
          margin: 0 0 1rem 0;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--divider);
        }

        h3 {
          font-family: 'Cinzel', serif;
          font-size: 1.1rem;
          color: var(--text);
          margin: 0 0 0.5rem 0;
        }

        .status-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          color: white;
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 1rem;
        }

        .status-details,
        .product-details,
        .customer-content,
        .payment-content {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .detail-row,
        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }

        .detail-row span:first-child,
        .price-row span:first-child {
          color: var(--text-dim);
        }

        .detail-row span:last-child,
        .price-row span:last-child {
          color: var(--text);
          font-weight: 500;
        }

        .payment-status {
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.85rem;
        }

        .holiday-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: var(--gold-light);
          color: var(--gold);
          border-radius: 4px;
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }

        .delivery-type {
          padding: 0.25rem 0.5rem;
          background: var(--bg-hover);
          border-radius: 4px;
          font-size: 0.85rem;
        }

        .price-row.total {
          margin-top: 0.75rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--divider);
        }

        .price-row.total span {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text);
        }

        .address-content {
          color: var(--text);
          line-height: 1.6;
        }

        .address-content p {
          margin: 0.25rem 0;
        }

        .mono {
          font-family: monospace;
          font-size: 0.85rem;
        }

        .action-btn {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background: var(--accent);
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-family: 'Cinzel', serif;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: background 0.2s;
        }

        .action-btn:hover {
          background: var(--accent-hover);
        }

        @media (max-width: 768px) {
          .order-grid {
            grid-template-columns: 1fr;
          }

          .order-header {
            flex-direction: column;
            align-items: flex-start;
          }

          h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}