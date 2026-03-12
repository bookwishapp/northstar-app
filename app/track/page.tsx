'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import OrderStatus from '@/components/track/OrderStatus';

function TrackContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState('');
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if order ID is provided in URL
  useEffect(() => {
    const orderParam = searchParams.get('order');
    if (orderParam) {
      setOrderId(orderParam);
      fetchOrderStatus(orderParam);
    }
  }, [searchParams]);

  async function fetchOrderStatus(id: string) {
    if (!id.trim()) {
      setError('Please enter an order ID');
      return;
    }

    setLoading(true);
    setError('');
    setOrderData(null);

    try {
      const response = await fetch(`/api/orders/${id}/status`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Order not found. Please check your order ID and try again.');
        }
        throw new Error('Failed to fetch order status');
      }

      const data = await response.json();
      setOrderData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchOrderStatus(orderId);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="/images/logo.png"
            alt="North Star Postal"
            className="h-24 w-auto mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Track Your Order
          </h1>
          <p className="text-gray-600">
            Enter your order ID to see the status of your magical letter
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter your order ID (e.g., cm3x7y8z...)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !orderId.trim()}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Checking...' : 'Track Order'}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Order Status Display */}
        {orderData && <OrderStatus order={orderData} />}

        {/* Help Section */}
        <div className="bg-gray-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Need Help?
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Where to find your order ID:</strong> Your order ID was sent to you in the claim email.
              It's a unique code that looks like "cm3x7y8z0000..."
            </p>
            <p>
              <strong>Can't find your order?</strong> Contact us at{' '}
              <a
                href="mailto:hello@northstarpostal.com"
                className="text-blue-600 hover:text-blue-700"
              >
                hello@northstarpostal.com
              </a>{' '}
              with your purchase details.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tracker...</p>
        </div>
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}