'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function CreateProgramPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const holidaySlug = params.slug as string;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const deliveryTypes = [];
    if (formData.get('digital')) deliveryTypes.push('digital');
    if (formData.get('physical')) deliveryTypes.push('physical');

    const data = {
      holidaySlug,
      name: formData.get('name'),
      tier: formData.get('tier'),
      deliveryTypes,
      priceDigital: formData.get('priceDigital') ? parseFloat(formData.get('priceDigital') as string) : null,
      pricePhysical: formData.get('pricePhysical') ? parseFloat(formData.get('pricePhysical') as string) : null,
      isActive: formData.get('isActive') === 'true',
    };

    try {
      const response = await fetch('/api/admin/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push(`/admin/holidays/${holidaySlug}/programs`);
      } else {
        alert('Failed to create program');
      }
    } catch (error) {
      alert('Failed to create program');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Create Program</h1>
          <p className="mt-2 text-sm text-gray-700">
            Add a new program for this holiday
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8 divide-y divide-gray-200">
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Program Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              placeholder="e.g. Easter Bunny Letter — Deluxe"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="tier" className="block text-sm font-medium text-gray-700">
              Tier
            </label>
            <select
              name="tier"
              id="tier"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
            >
              <option value="standard">Standard</option>
              <option value="deluxe">Deluxe</option>
            </select>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">Delivery Types</legend>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="digital"
                  id="digital"
                  defaultChecked
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="digital" className="ml-2 block text-sm text-gray-900">
                  Digital
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="physical"
                  id="physical"
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="physical" className="ml-2 block text-sm text-gray-900">
                  Physical
                </label>
              </div>
            </div>
          </fieldset>

          <div>
            <label htmlFor="priceDigital" className="block text-sm font-medium text-gray-700">
              Price (Digital) - leave blank if not offered
            </label>
            <input
              type="number"
              name="priceDigital"
              id="priceDigital"
              step="0.01"
              placeholder="29.99"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="pricePhysical" className="block text-sm font-medium text-gray-700">
              Price (Physical) - leave blank if not offered
            </label>
            <input
              type="number"
              name="pricePhysical"
              id="pricePhysical"
              step="0.01"
              placeholder="49.99"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              value="true"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push(`/admin/holidays/${holidaySlug}/programs`)}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Program'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}