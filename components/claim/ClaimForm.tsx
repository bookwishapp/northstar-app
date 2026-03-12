'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getHolidayDisplayName } from '@/lib/claim-fields';
import type { PersonalizationField } from '@/lib/handlebars-utils';
import ContentPreview from './ContentPreview';

interface Props {
  token: string;
  order: {
    id?: string;
    recipientName: string | null;
    holidaySlug: string;
    programId: string;
    deliveryType: string;
    status?: string;
    // Existing data if already filled
    customerName?: string | null;
    customerEmail?: string | null;
    recipientAge?: number | null;
    recipientDetails?: any;
    recipientAddress?: any;
    deliveryAddress?: any;
    emailConsent?: boolean | null;
    // Generated content if exists
    generatedLetter?: string | null;
    generatedStory?: string | null;
    regenerationCount?: number;
    claimedAt?: string | null;
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Check if we're in generating state
  useEffect(() => {
    if (order.status === 'pending_generation' && !order.generatedLetter) {
      setIsGenerating(true);
      // Poll for content every 3 seconds
      const interval = setInterval(() => {
        router.refresh();
      }, 3000);
      return () => clearInterval(interval);
    } else if (order.generatedLetter && order.generatedStory) {
      setIsGenerating(false);
      setShowPreview(true);
    }
  }, [order.status, order.generatedLetter, order.generatedStory, router]);

  // Initialize form with existing data or defaults
  const [formData, setFormData] = useState({
    customerName: order.customerName || '',
    recipientName: order.recipientName || '',
    recipientAge: order.recipientAge?.toString() || '',
    deliveryEmail: order.customerEmail || '',
    emailConsent: order.emailConsent || false,
    recipientDetails: order.recipientDetails || {} as Record<string, any>,
    recipientAddress: order.recipientAddress || {
      name: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip: '',
      country: 'USA'
    },
    deliveryAddress: order.deliveryAddress || {
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
  const hasContent = !!(order.generatedLetter && order.generatedStory);
  const regenerationCount = order.regenerationCount || 0;
  const canRegenerate = regenerationCount < 3;

  async function handleSubmit(e: React.FormEvent, action: 'generate' | 'regenerate' | 'approve' = 'generate') {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const recipientDetails: Record<string, any> = {};

      // Clean up recipient details
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
        action,
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

      const result = await response.json();

      // Handle different responses based on action
      if (action === 'approve') {
        router.push(`/claim/${token}/success`);
      } else {
        // For generate/regenerate, refresh to show loading state
        setIsGenerating(true);
        // Start polling for updates
        setTimeout(() => router.refresh(), 2000);
      }
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
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
          rows={3}
          placeholder={field.placeholder || ''}
        />
      );
    }

    const inputType = field.type === 'number' ? 'number' : 'text';

    return (
      <input
        type={inputType}
        value={value}
        onChange={(e) => setFormData({
          ...formData,
          recipientDetails: {
            ...formData.recipientDetails,
            [field.name]: e.target.value
          }
        })}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
        placeholder={field.placeholder || ''}
      />
    );
  }

  // Show generating state
  if (isGenerating) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="animate-pulse">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Creating Your Magical Letter...
          </h2>
          <p className="text-gray-600 mb-4">
            {template.character} is writing a personalized letter for {formData.recipientName || 'your special someone'}
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            This usually takes 10-30 seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-green-600 text-white p-6">
        <h1 className="text-2xl font-bold">
          {hasContent ? 'Review & Personalize Your Letter' : `Personalize Your ${holidayName} Letter`}
        </h1>
        <p className="mt-2 text-red-100">
          {hasContent
            ? `From ${template.character} - ${program.name}`
            : `Tell us about ${order.recipientName || 'the recipient'} to create their magical letter`}
        </p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, hasContent ? 'regenerate' : 'generate')} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Basic Information Section */}
        <div className="border-b pb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Your Name *
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Your Email *
              </label>
              <input
                type="email"
                required
                value={formData.deliveryEmail}
                onChange={(e) => setFormData({ ...formData, deliveryEmail: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Recipient Information Section */}
        <div className="border-b pb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recipient Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Recipient's Name *
              </label>
              <input
                type="text"
                required
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Recipient's Age *
              </label>
              <input
                type="number"
                required
                min="1"
                max="100"
                value={formData.recipientAge}
                onChange={(e) => setFormData({ ...formData, recipientAge: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>
        </div>

        {/* Custom Fields Section */}
        {fields.length > 0 && (
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personalization Details</h2>
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && ' *'}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Address Section (collapsed by default if content exists) */}
        <details open={!hasContent}>
          <summary className="cursor-pointer text-lg font-semibold text-gray-900 mb-4">
            Delivery Information
          </summary>

          {/* Recipient Address */}
          <div className="mt-4">
            <h3 className="text-md font-medium text-gray-900 mb-3">Recipient's Address</h3>
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                required
                placeholder="Recipient's Full Name"
                value={formData.recipientAddress.name}
                onChange={(e) => setFormData({
                  ...formData,
                  recipientAddress: { ...formData.recipientAddress, name: e.target.value }
                })}
                className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
              <input
                type="text"
                required
                placeholder="Street Address"
                value={formData.recipientAddress.line1}
                onChange={(e) => setFormData({
                  ...formData,
                  recipientAddress: { ...formData.recipientAddress, line1: e.target.value }
                })}
                className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
              <input
                type="text"
                placeholder="Apartment, suite, etc. (optional)"
                value={formData.recipientAddress.line2}
                onChange={(e) => setFormData({
                  ...formData,
                  recipientAddress: { ...formData.recipientAddress, line2: e.target.value }
                })}
                className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={formData.recipientAddress.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    recipientAddress: { ...formData.recipientAddress, city: e.target.value }
                  })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
                <input
                  type="text"
                  required
                  placeholder="State"
                  value={formData.recipientAddress.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    recipientAddress: { ...formData.recipientAddress, state: e.target.value }
                  })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="ZIP Code"
                  value={formData.recipientAddress.zip}
                  onChange={(e) => setFormData({
                    ...formData,
                    recipientAddress: { ...formData.recipientAddress, zip: e.target.value }
                  })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
                <input
                  type="text"
                  required
                  placeholder="Country"
                  value={formData.recipientAddress.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    recipientAddress: { ...formData.recipientAddress, country: e.target.value }
                  })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
              </div>
            </div>
          </div>

          {/* Physical Delivery Address */}
          {isPhysical && (
            <div className="mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-3">Physical Delivery Address</h3>
              <p className="text-sm text-gray-500 mb-3">Where should we mail the physical letter?</p>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Street Address"
                  value={formData.deliveryAddress.line1}
                  onChange={(e) => setFormData({
                    ...formData,
                    deliveryAddress: { ...formData.deliveryAddress, line1: e.target.value }
                  })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
                <input
                  type="text"
                  placeholder="Apartment, suite, etc. (optional)"
                  value={formData.deliveryAddress.line2}
                  onChange={(e) => setFormData({
                    ...formData,
                    deliveryAddress: { ...formData.deliveryAddress, line2: e.target.value }
                  })}
                  className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={formData.deliveryAddress.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      deliveryAddress: { ...formData.deliveryAddress, city: e.target.value }
                    })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={formData.deliveryAddress.state}
                    onChange={(e) => setFormData({
                      ...formData,
                      deliveryAddress: { ...formData.deliveryAddress, state: e.target.value }
                    })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="ZIP Code"
                    value={formData.deliveryAddress.zip}
                    onChange={(e) => setFormData({
                      ...formData,
                      deliveryAddress: { ...formData.deliveryAddress, zip: e.target.value }
                    })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Country"
                    value={formData.deliveryAddress.country}
                    onChange={(e) => setFormData({
                      ...formData,
                      deliveryAddress: { ...formData.deliveryAddress, country: e.target.value }
                    })}
                    className="rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>
          )}
        </details>

        {/* Email Consent */}
        <div className="flex items-start">
          <input
            type="checkbox"
            id="emailConsent"
            checked={formData.emailConsent}
            onChange={(e) => setFormData({ ...formData, emailConsent: e.target.checked })}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <label htmlFor="emailConsent" className="ml-2 block text-sm text-gray-700">
            I'd like to receive occasional updates about new holiday programs and special offers
          </label>
        </div>

        {/* Generated Content Preview */}
        {hasContent && (
          <ContentPreview
            letter={order.generatedLetter!}
            story={order.generatedStory!}
            regenerationCount={regenerationCount}
          />
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          {hasContent && (
            <>
              {canRegenerate && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : `🔄 Regenerate (${3 - regenerationCount} left)`}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'approve')}
                disabled={isSubmitting}
                className="px-8 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Processing...' : '✅ Approve & Send Letter'}
              </button>
            </>
          )}
          {!hasContent && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Generating...' : 'Generate Personalized Letter'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}