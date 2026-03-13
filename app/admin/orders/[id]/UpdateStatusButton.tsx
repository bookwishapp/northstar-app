'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface UpdateStatusButtonProps {
  orderId: string;
  currentStatus: string;
  currentErrorMessage?: string | null;
}

export default function UpdateStatusButton({
  orderId,
  currentStatus,
  currentErrorMessage
}: UpdateStatusButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [errorMessage, setErrorMessage] = useState(currentErrorMessage || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const statuses = [
    { value: 'pending_claim', label: 'Pending Claim' },
    { value: 'claimed', label: 'Claimed' },
    { value: 'pending_generation', label: 'Pending Generation' },
    { value: 'pending_pdf', label: 'Pending PDF' },
    { value: 'pending_delivery', label: 'Pending Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'failed', label: 'Failed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'refunded', label: 'Refunded' },
  ];

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          ...(status === 'failed' && errorMessage ? { errorMessage } : {}),
        }),
      });

      if (response.ok) {
        router.refresh();
        setShowForm(false);
      } else {
        console.error('Failed to update status');
        alert('Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating order status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Update Status
      </button>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <h4 className="font-medium text-gray-900">Update Order Status</h4>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          New Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm rounded-md"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {status === 'failed' && (
        <div>
          <label htmlFor="errorMessage" className="block text-sm font-medium text-gray-700">
            Error Message
          </label>
          <textarea
            id="errorMessage"
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            rows={3}
            className="mt-1 block w-full shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm border-gray-300 rounded-md"
            placeholder="Describe the error..."
          />
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          {isUpdating ? 'Updating...' : 'Update Status'}
        </button>
        <button
          onClick={() => {
            setShowForm(false);
            setStatus(currentStatus);
            setErrorMessage(currentErrorMessage || '');
          }}
          disabled={isUpdating}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}