'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getHolidayDisplayName } from '@/lib/claim-fields';
import type { PersonalizationField } from '@/lib/handlebars-utils';

interface Props {
  token: string;
  order: {
    recipientName: string | null;
    holidaySlug: string;
    programId: string;
    deliveryType: string;
  };
  template: {
    character: string;
    holidaySlug: string;
    personalizationFields?: PersonalizationField[];
  };
  program: {
    name: string;
    tier: string;
  };
}

export default function ClaimForm({ token, order, template, program }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    recipientName: order.recipientName || '',
    recipientAge: '',
    deliveryEmail: '',
    emailConsent: false,
    recipientDetails: {} as Record<string, any>,
    recipientAddress: {
      name: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA'
    },
    deliveryAddress: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA'
    }
  });

  const holidayName = getHolidayDisplayName(order.holidaySlug);
  const fields = template.personalizationFields || [];
  const isPhysical = order.deliveryType === 'physical';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const recipientDetails: Record<string, any> = {};

      fields.forEach((field) => {
        const value = formData.recipientDetails[field.name];
        if (value !== undefined && value !== null && value !== '') {
          if (field.type === 'number') {
            recipientDetails[field.name] = Number(value);
          } else {
            recipientDetails[field.name] = value;
          }
        }
      });

      const payload = {
        ...formData,
        recipientAge: parseInt(formData.recipientAge),
        recipientDetails,
        recipientAddress: formData.recipientAddress,
        deliveryAddress: isPhysical ? formData.deliveryAddress : undefined
      };

      const response = await fetch(`/api/claim/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit');
      }

      router.push(`/claim/${token}/success`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  }

  function renderField(field: PersonalizationField) {
    const value = formData.recipientDetails[field.name] || '';

    if (field.type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => setFormData({
            ...formData,
            recipientDetails: {
              ...formData.recipientDetails,
              [field.name]: e.target.value
            }
          })}
          placeholder={field.placeholder}
          required={field.required}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
        />
      );
    }

    if (field.type === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={(e) => setFormData({
            ...formData,
            recipientDetails: {
              ...formData.recipientDetails,
              [field.name]: e.target.value
            }
          })}
          placeholder={field.placeholder}
          required={field.required}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => setFormData({
          ...formData,
          recipientDetails: {
            ...formData.recipientDetails,
            [field.name]: e.target.value
          }
        })}
        placeholder={field.placeholder}
        required={field.required}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
      />
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Personalize Your {holidayName} Letter
        </h1>
        <p className="text-lg text-gray-600">
          From {template.character} • {program.tier === 'premium' ? 'Premium' : program.tier === 'deluxe' ? 'Deluxe' : 'Standard'} Package
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-lg p-8 space-y-6">
        {/* Your Information */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Information</h2>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Your Name
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                placeholder="Parent or gift giver name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Delivery Email
              </label>
              <input
                type="email"
                required
                value={formData.deliveryEmail}
                onChange={(e) => setFormData({ ...formData, deliveryEmail: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                placeholder="Where we'll send the letter"
              />
            </div>

            <div className="flex items-center">
              <input
                id="emailConsent"
                type="checkbox"
                checked={formData.emailConsent}
                onChange={(e) => setFormData({ ...formData, emailConsent: e.target.checked })}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="emailConsent" className="ml-2 block text-sm text-gray-700">
                Send me occasional updates about new holidays and special offers
              </label>
            </div>
          </div>
        </div>

        {/* Recipient Information */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recipient Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Child's Name
              </label>
              <input
                type="text"
                required
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                placeholder="Who is this letter for?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Age
              </label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={formData.recipientAge}
                onChange={(e) => setFormData({ ...formData, recipientAge: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                placeholder="How old are they?"
              />
            </div>
          </div>
        </div>

        {/* Recipient Address */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recipient Address</h2>
          <p className="text-sm text-gray-600 mb-4">
            Who is this letter for? This information will appear on the letter.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Recipient Full Name
              </label>
              <input
                type="text"
                required
                value={formData.recipientAddress.name}
                onChange={(e) => setFormData({
                  ...formData,
                  recipientAddress: { ...formData.recipientAddress, name: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Street Address
              </label>
              <input
                type="text"
                required
                value={formData.recipientAddress.line1}
                onChange={(e) => setFormData({
                  ...formData,
                  recipientAddress: { ...formData.recipientAddress, line1: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Apartment, Suite, etc. (Optional)
              </label>
              <input
                type="text"
                value={formData.recipientAddress.line2}
                onChange={(e) => setFormData({
                  ...formData,
                  recipientAddress: { ...formData.recipientAddress, line2: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={formData.recipientAddress.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    recipientAddress: { ...formData.recipientAddress, city: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State/Province
                </label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={formData.recipientAddress.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    recipientAddress: { ...formData.recipientAddress, state: e.target.value.toUpperCase() }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="XX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  ZIP/Postal Code
                </label>
                <input
                  type="text"
                  required
                  value={formData.recipientAddress.zip}
                  onChange={(e) => setFormData({
                    ...formData,
                    recipientAddress: { ...formData.recipientAddress, zip: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Country
              </label>
              <input
                type="text"
                required
                value={formData.recipientAddress.country}
                onChange={(e) => setFormData({
                  ...formData,
                  recipientAddress: { ...formData.recipientAddress, country: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Holiday-Specific Fields */}
        <div className="border-b pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Tell {template.character} More
          </h2>

          <div className="space-y-6">
            {fields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>
        </div>

        {/* Physical Delivery Address */}
        {isPhysical && (
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Address</h2>
            <p className="text-sm text-gray-600 mb-4">
              Where should we mail the physical letter?
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address Line 1
                </label>
                <input
                  type="text"
                  required
                  value={formData.deliveryAddress.line1}
                  onChange={(e) => setFormData({
                    ...formData,
                    deliveryAddress: { ...formData.deliveryAddress, line1: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={formData.deliveryAddress.line2}
                  onChange={(e) => setFormData({
                    ...formData,
                    deliveryAddress: { ...formData.deliveryAddress, line2: e.target.value }
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryAddress.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      deliveryAddress: { ...formData.deliveryAddress, city: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={formData.deliveryAddress.state}
                    onChange={(e) => setFormData({
                      ...formData,
                      deliveryAddress: { ...formData.deliveryAddress, state: e.target.value.toUpperCase() }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                    placeholder="XX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.deliveryAddress.zip}
                    onChange={(e) => setFormData({
                      ...formData,
                      deliveryAddress: { ...formData.deliveryAddress, zip: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Creating Magic...' : `Create ${template.character}'s Letter`}
          </button>
        </div>
      </form>
    </div>
  );
}