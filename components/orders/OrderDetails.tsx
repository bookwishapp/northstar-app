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
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'processing':
      case 'pending_claim':
      case 'pending_delivery':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string | null) => {
    switch (status) {
      case 'paid':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/track" className="inline-flex items-center text-red-600 hover:text-red-700 mb-6">
          ← Back to Order Tracking
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
          <div
            className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={copyOrderId}
          >
            <span className="font-mono text-sm text-gray-600">Order ID: {order.id}</span>
            <button className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors">
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Order Status Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
              Order Status
            </h2>
            <div>
              <span className={`inline-block px-4 py-2 rounded-md font-semibold text-sm mb-4 ${getStatusColor(order.status)}`}>
                {order.status?.replace(/_/g, ' ').toUpperCase() || 'PENDING'}
              </span>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Payment Status:</span>
                  <span className={`font-semibold uppercase ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentStatus || 'PENDING'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Placed:</span>
                  <span className="text-gray-900">{formatDate(order.createdAt)}</span>
                </div>
                {order.paidAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Paid:</span>
                    <span className="text-gray-900">{formatDate(order.paidAt)}</span>
                  </div>
                )}
                {order.claimedAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Claimed:</span>
                    <span className="text-gray-900">{formatDate(order.claimedAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Details Card */}
          {order.program && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Product Details
              </h2>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{order.program.name}</h3>
                {order.program.holiday && (
                  <p className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-sm mb-4">
                    {order.program.holiday.name}
                  </p>
                )}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Type:</span>
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-700">
                      {order.deliveryType === 'digital' ? 'Digital Delivery' : 'Physical Letter'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Price:</span>
                    <span className="text-gray-900 font-medium">{formatCurrency(order.subtotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
              Order Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal:</span>
                <span className="text-gray-900 font-medium">{formatCurrency(order.subtotal)}</span>
              </div>
              {order.shippingCost && order.shippingCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping ({order.shippingMethod}):</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(order.shippingCost)}</span>
                </div>
              )}
              {order.taxAmount && order.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax:</span>
                  <span className="text-gray-900 font-medium">{formatCurrency(order.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold pt-3 border-t border-gray-200">
                <span>Total:</span>
                <span>{formatCurrency(order.totalAmount || order.subtotal)}</span>
              </div>
            </div>
          </div>

          {/* Customer Information Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
              Customer Information
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Name:</span>
                <span className="text-gray-900 font-medium">{order.customerName || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email:</span>
                <span className="text-gray-900 font-medium">{order.customerEmail}</span>
              </div>
              {order.recipientName && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Recipient:</span>
                  <span className="text-gray-900 font-medium">{order.recipientName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Billing Address Card */}
          {billingAddress && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Billing Address
              </h2>
              <div className="text-sm text-gray-700 space-y-1">
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
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Shipping Address
              </h2>
              <div className="text-sm text-gray-700 space-y-1">
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
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Payment Information
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Method:</span>
                  <span className="text-gray-900 font-medium">Credit/Debit Card</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Session ID:</span>
                  <p className="font-mono text-xs text-gray-700 mt-1">{order.stripeSessionId.slice(0, 20)}...</p>
                </div>
                {order.stripePaymentIntentId && (
                  <div className="text-sm">
                    <span className="text-gray-500">Payment ID:</span>
                    <p className="font-mono text-xs text-gray-700 mt-1">{order.stripePaymentIntentId.slice(0, 20)}...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions Card */}
          {order.status === 'pending_claim' && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Actions
              </h2>
              <div>
                <p className="text-sm text-gray-700 mb-4">Check your email for the claim link to customize your letter!</p>
                <Link
                  href="/track"
                  className="inline-block px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium uppercase tracking-wider"
                >
                  Track Another Order
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}