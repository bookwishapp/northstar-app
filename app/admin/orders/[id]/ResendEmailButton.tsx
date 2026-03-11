'use client';

import { useState } from 'react';

interface ResendEmailButtonProps {
  orderId: string;
  customerEmail: string;
}

export default function ResendEmailButton({ orderId, customerEmail }: ResendEmailButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleResend() {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/resend-email`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Email sent to ${customerEmail}`);
      } else {
        setMessage(data.error || 'Failed to resend email');
      }
    } catch (error) {
      setMessage('Failed to resend email');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleResend}
        disabled={isLoading}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
      >
        {isLoading ? 'Sending...' : 'Resend Claim Email'}
      </button>
      {message && (
        <span className={`text-sm ${message.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </span>
      )}
    </div>
  );
}