'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Program {
  id: string;
  name: string;
  tier: string;
  holidaySlug: string;
  template: {
    character: string;
  };
}

interface Props {
  programs: Program[];
}

export default function OrderCreateForm({ programs }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    programId: '',
    deliveryType: 'digital',
    customerEmail: '',
    externalOrderId: '',
  });

  const holidays = [...new Set(programs.map(p => p.holidaySlug))];

  const selectedProgram = programs.find(p => p.id === formData.programId);
  const availablePrograms = formData.programId
    ? programs.filter(p => p.holidaySlug === selectedProgram?.holidaySlug)
    : programs;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();
      router.push(`/admin/orders/${data.order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Holiday
          </label>
          <select
            required
            value={selectedProgram?.holidaySlug || ''}
            onChange={(e) => {
              const firstProgram = programs.find(p => p.holidaySlug === e.target.value);
              setFormData({ ...formData, programId: firstProgram?.id || '' });
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
          >
            <option value="">Select a holiday</option>
            {holidays.map((holiday) => (
              <option key={holiday} value={holiday}>
                {holiday}
              </option>
            ))}
          </select>
        </div>

        {selectedProgram && (
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Program Tier
            </label>
            <select
              required
              value={formData.programId}
              onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
            >
              <option value="">Select a program</option>
              {availablePrograms
                .filter(p => p.holidaySlug === selectedProgram.holidaySlug)
                .map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.tier} - {program.name} ({program.template.character})
                  </option>
                ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Delivery Type
          </label>
          <select
            value={formData.deliveryType}
            onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
          >
            <option value="digital">Digital (Email)</option>
            <option value="physical">Physical (Mail)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Customer Email
          </label>
          <input
            type="email"
            required
            value={formData.customerEmail}
            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
            placeholder="customer@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            External Order ID (Optional)
          </label>
          <input
            type="text"
            value={formData.externalOrderId}
            onChange={(e) => setFormData({ ...formData, externalOrderId: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
            placeholder="Etsy order ID or other reference"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => router.push('/admin/orders')}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Order'}
        </button>
      </div>
    </form>
  );
}