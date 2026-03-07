'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateHolidayPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [slug, setSlug] = useState('');
  const router = useRouter();

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      displayOrder: parseInt(formData.get('displayOrder') as string),
      orderDeadlineLabel: formData.get('orderDeadlineLabel'),
      isActive: formData.get('isActive') === 'true',
    };

    try {
      const response = await fetch('/api/admin/holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/admin/holidays/${result.slug}`);
      } else {
        alert('Failed to create holiday');
      }
    } catch (error) {
      alert('Failed to create holiday');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Create Holiday</h1>
          <p className="mt-2 text-sm text-gray-700">
            Add a new holiday to the system
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8 divide-y divide-gray-200">
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Holiday Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              placeholder="e.g. Mother's Day"
              onChange={(e) => setSlug(generateSlug(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
              Slug (auto-generated, editable)
            </label>
            <input
              type="text"
              name="slug"
              id="slug"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. mothers_day"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="displayOrder" className="block text-sm font-medium text-gray-700">
              Display Order
            </label>
            <input
              type="number"
              name="displayOrder"
              id="displayOrder"
              required
              defaultValue="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="orderDeadlineLabel" className="block text-sm font-medium text-gray-700">
              Order Deadline Label
            </label>
            <input
              type="text"
              name="orderDeadlineLabel"
              id="orderDeadlineLabel"
              placeholder="e.g. Order by May 7"
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
              Active (visible on public site)
            </label>
          </div>
        </div>

        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push('/admin/holidays')}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Holiday'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}