'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Program {
  id: string;
  name: string;
  tier: string;
  deliveryTypes: string[];
  productTypes?: string[];
  priceDigital: number | null;
  pricePhysical: number | null;
  isActive: boolean;
  templateId: string;
  template?: {
    id: string;
    name: string;
  };
}

interface Template {
  id: string;
  name: string;
  character: string;
}

export default function EditProgramPage() {
  const [program, setProgram] = useState<Program | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const params = useParams();
  const holidaySlug = params.slug as string;
  const programId = params.id as string;

  useEffect(() => {
    // Fetch program data
    fetch(`/api/admin/programs?id=${programId}`)
      .then(res => res.json())
      .then(data => {
        setProgram(data);
        setIsLoading(false);
      })
      .catch(() => {
        alert('Failed to load program');
        setIsLoading(false);
      });

    // Fetch available templates
    fetch('/api/admin/templates')
      .then(res => res.json())
      .then(data => setTemplates(data.templates || []))
      .catch(() => console.error('Failed to load templates'));
  }, [programId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);

    const formData = new FormData(e.currentTarget);
    const deliveryTypes = [];
    if (formData.get('digital')) deliveryTypes.push('digital');
    if (formData.get('physical')) deliveryTypes.push('physical');

    const productTypes = [];
    if (formData.get('letter')) productTypes.push('letter');
    if (formData.get('story')) productTypes.push('story');

    const data = {
      name: formData.get('name'),
      tier: formData.get('tier'),
      deliveryTypes,
      productTypes: productTypes.length > 0 ? productTypes : ['letter', 'story'], // Default to both if none selected
      priceDigital: formData.get('priceDigital') ? parseFloat(formData.get('priceDigital') as string) : null,
      pricePhysical: formData.get('pricePhysical') ? parseFloat(formData.get('pricePhysical') as string) : null,
      isActive: formData.get('isActive') === 'true',
      templateId: formData.get('templateId'),
    };

    try {
      const response = await fetch(`/api/admin/programs?id=${programId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        router.push(`/admin/holidays/${holidaySlug}/programs`);
      } else {
        alert('Failed to update program');
      }
    } catch (error) {
      alert('Failed to update program');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Program not found</div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Edit Program</h1>
          <Link
            href={`/admin/holidays/${holidaySlug}/programs`}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Program Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              defaultValue={program.name}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="tier" className="block text-sm font-medium text-gray-700">
              Tier
            </label>
            <select
              name="tier"
              id="tier"
              defaultValue={program.tier}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
            >
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="deluxe">Deluxe</option>
            </select>
          </div>

          <div>
            <label htmlFor="templateId" className="block text-sm font-medium text-gray-700">
              Template
            </label>
            <select
              name="templateId"
              id="templateId"
              defaultValue={program.templateId}
              required
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
            >
              <option value="">Select a template</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.character})
                </option>
              ))}
            </select>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">Product Types</legend>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  id="letter"
                  name="letter"
                  type="checkbox"
                  defaultChecked={program.productTypes?.includes('letter') ?? true}
                  className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
                />
                <label htmlFor="letter" className="ml-3 text-sm text-gray-700">
                  Personalized Letter
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="story"
                  name="story"
                  type="checkbox"
                  defaultChecked={program.productTypes?.includes('story') ?? true}
                  className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
                />
                <label htmlFor="story" className="ml-3 text-sm text-gray-700">
                  Personalized Story
                </label>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium text-gray-700">Delivery Types</legend>
            <div className="mt-2 space-y-2">
              <div className="flex items-center">
                <input
                  id="digital"
                  name="digital"
                  type="checkbox"
                  defaultChecked={program.deliveryTypes.includes('digital')}
                  className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
                />
                <label htmlFor="digital" className="ml-3 text-sm text-gray-700">
                  Digital Delivery
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="physical"
                  name="physical"
                  type="checkbox"
                  defaultChecked={program.deliveryTypes.includes('physical')}
                  className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
                />
                <label htmlFor="physical" className="ml-3 text-sm text-gray-700">
                  Physical Mail
                </label>
              </div>
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="priceDigital" className="block text-sm font-medium text-gray-700">
                Digital Price ($)
              </label>
              <input
                type="number"
                name="priceDigital"
                id="priceDigital"
                step="0.01"
                defaultValue={program.priceDigital || ''}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="pricePhysical" className="block text-sm font-medium text-gray-700">
                Physical Price ($)
              </label>
              <input
                type="number"
                name="pricePhysical"
                id="pricePhysical"
                step="0.01"
                defaultValue={program.pricePhysical || ''}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="isActive" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              name="isActive"
              id="isActive"
              defaultValue={program.isActive ? 'true' : 'false'}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href={`/admin/holidays/${holidaySlug}/programs`}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}