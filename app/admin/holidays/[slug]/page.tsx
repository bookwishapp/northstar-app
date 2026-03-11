'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TestPromptModal from '@/components/admin/TestPromptModal';
import {
  extractTemplateVariables,
  generateFieldConfig,
  type PersonalizationField
} from '@/lib/handlebars-utils';

export default function EditHolidayTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const holidaySlug = params.slug as string;
  const [activeTab, setActiveTab] = useState('graphics');
  const [template, setTemplate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedVariables, setExtractedVariables] = useState<string[]>([]);

  // Test prompt modal state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testPromptType, setTestPromptType] = useState<'letter' | 'story'>('letter');

  useEffect(() => {
    // Fetch template data for this holiday
    fetchTemplate();
  }, [holidaySlug]);

  useEffect(() => {
    // Extract variables from prompts when template changes
    if (template) {
      const vars = extractTemplateVariables({
        letterPrompt: template.letterPrompt,
        storyPrompt: template.storyPrompt
      });
      setExtractedVariables(vars);
    }
  }, [template?.letterPrompt, template?.storyPrompt]);

  async function fetchTemplate() {
    try {
      const response = await fetch(`/api/admin/templates?holidaySlug=${holidaySlug}`);
      if (response.ok) {
        const data = await response.json();
        setTemplate(data);
      }
    } catch (error) {
      console.error('Failed to fetch template:', error);
    }
  }

  async function handleSave() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/templates/${template?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(template),
      });

      if (response.ok) {
        alert('Template saved successfully');
      } else {
        alert('Failed to save template');
      }
    } catch (error) {
      alert('Failed to save template');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(slot: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('slot', slot);

    try {
      const response = await fetch(`/api/admin/templates/${template?.id}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh template to get new S3 keys
        fetchTemplate();
        alert(`${slot} uploaded successfully`);
      } else {
        alert(`Failed to upload ${slot}`);
      }
    } catch (error) {
      alert(`Failed to upload ${slot}`);
    }
  }

  if (!template) {
    return <div className="px-4 py-6">Loading...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 capitalize">
            {holidaySlug.replace(/_/g, ' ')} Template
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure graphics, layout, and AI prompts
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('graphics')}
              className={`${
                activeTab === 'graphics'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Graphics & Layout
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className={`${
                activeTab === 'prompts'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              AI Prompts
            </button>
            <button
              onClick={() => setActiveTab('personalization')}
              className={`${
                activeTab === 'personalization'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Personalization Fields
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'graphics' && (
          <div className="space-y-8">
            {/* Graphic Uploads */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Graphics</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { slot: 'background', label: 'Background', key: 'backgroundKey' },
                  { slot: 'header', label: 'Header', key: 'headerKey' },
                  { slot: 'character', label: 'Character', key: 'characterKey' },
                  { slot: 'waxSeal', label: 'Wax Seal', key: 'waxSealKey' },
                  { slot: 'signature', label: 'Signature Block', key: 'signatureKey' },
                  { slot: 'envelopeBackground', label: 'Envelope Background', key: 'envelopeBackgroundKey' },
                  { slot: 'emailHeader', label: 'Email Header', key: 'emailHeaderKey' },
                ].map((graphic) => (
                  <div key={graphic.slot} className="border rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {graphic.label}
                    </label>
                    {template[graphic.key] && (
                      <div className="mb-2 text-xs text-gray-500">
                        Current: {template[graphic.key]}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(graphic.slot, e.target.files[0]);
                        }
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Layout Config */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Layout Configuration</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Primary Color</label>
                  <input
                    type="color"
                    value={template.primaryColor || '#2c1810'}
                    onChange={(e) => setTemplate({ ...template, primaryColor: e.target.value })}
                    className="mt-1 block h-10 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Accent Color</label>
                  <input
                    type="color"
                    value={template.accentColor || '#8b0000'}
                    onChange={(e) => setTemplate({ ...template, accentColor: e.target.value })}
                    className="mt-1 block h-10 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Paper Size</label>
                  <select
                    value={template.paperSize || 'letter'}
                    onChange={(e) => setTemplate({ ...template, paperSize: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  >
                    <option value="letter">Letter</option>
                    <option value="a4">A4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Margin Top</label>
                  <input
                    type="text"
                    value={template.marginTop || '1.2in'}
                    onChange={(e) => setTemplate({ ...template, marginTop: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Margin Bottom</label>
                  <input
                    type="text"
                    value={template.marginBottom || '1in'}
                    onChange={(e) => setTemplate({ ...template, marginBottom: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Margin Left</label>
                  <input
                    type="text"
                    value={template.marginLeft || '0.9in'}
                    onChange={(e) => setTemplate({ ...template, marginLeft: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Margin Right</label>
                  <input
                    type="text"
                    value={template.marginRight || '0.9in'}
                    onChange={(e) => setTemplate({ ...template, marginRight: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={template.repeatBackground ?? true}
                    onChange={(e) => setTemplate({ ...template, repeatBackground: e.target.checked })}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Repeat Background</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={template.headerFirstPageOnly ?? true}
                    onChange={(e) => setTemplate({ ...template, headerFirstPageOnly: e.target.checked })}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Header First Page Only</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={template.waxSealLastPageOnly ?? true}
                    onChange={(e) => setTemplate({ ...template, waxSealLastPageOnly: e.target.checked })}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Wax Seal Last Page Only</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prompts' && (
          <div className="space-y-8">
            {/* Character Config */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Character Configuration</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Character Name</label>
                  <input
                    type="text"
                    value={template.character || ''}
                    onChange={(e) => setTemplate({ ...template, character: e.target.value })}
                    placeholder="e.g. the Easter Bunny"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Character Tone</label>
                  <textarea
                    value={template.characterTone || ''}
                    onChange={(e) => setTemplate({ ...template, characterTone: e.target.value })}
                    rows={3}
                    placeholder="e.g. cheerful, playful, warm, slightly mischievous..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Letter Prompt */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Letter Prompt</label>
                <button
                  onClick={() => {
                    setTestPromptType('letter');
                    setIsTestModalOpen(true);
                  }}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Test Prompt
                </button>
              </div>
              <textarea
                value={template.letterPrompt || ''}
                onChange={(e) => setTemplate({ ...template, letterPrompt: e.target.value })}
                rows={20}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm font-mono"
              />
              <div className="mt-1 text-xs text-gray-500">
                {(template.letterPrompt || '').length} characters
              </div>
            </div>

            {/* Story Prompt */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Story Prompt</label>
                <button
                  onClick={() => {
                    setTestPromptType('story');
                    setIsTestModalOpen(true);
                  }}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Test Prompt
                </button>
              </div>
              <textarea
                value={template.storyPrompt || ''}
                onChange={(e) => setTemplate({ ...template, storyPrompt: e.target.value })}
                rows={20}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm font-mono"
              />
              <div className="mt-1 text-xs text-gray-500">
                {(template.storyPrompt || '').length} characters
              </div>
            </div>
          </div>
        )}

        {/* Personalization Tab */}
        {activeTab === 'personalization' && (
          <div className="space-y-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                Handlebars Variables in Your Prompts
              </h3>
              <p className="text-xs text-yellow-700 mb-3">
                These variables are detected from your letter and story prompts. Configure how each field appears in the claim form.
              </p>
              {extractedVariables.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {extractedVariables.map((variable) => (
                    <code key={variable} className="bg-yellow-100 px-2 py-1 rounded text-xs">
                      {`{{${variable}}}`}
                    </code>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-yellow-600 italic">
                  No variables found. Add Handlebars variables like {`{{childName}}`} to your prompts.
                </p>
              )}
            </div>

            {/* Field Configuration */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configure Personalization Fields</h3>
              <p className="text-sm text-gray-600 mb-6">
                Configure how each field appears in the claim form. The field key must match the Handlebars variable name exactly.
              </p>

              <div className="space-y-6">
                {/* Existing Fields */}
                {(template.personalizationFields || []).map((field: PersonalizationField, index: number) => (
                  <div key={field.name} className="bg-white p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Variable Name (must match Handlebars)
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => {
                            const fields = [...(template.personalizationFields || [])];
                            fields[index] = { ...fields[index], name: e.target.value };
                            setTemplate({ ...template, personalizationFields: fields });
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                          placeholder="e.g., favoriteActivities"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Display Label</label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => {
                            const fields = [...(template.personalizationFields || [])];
                            fields[index] = { ...fields[index], label: e.target.value };
                            setTemplate({ ...template, personalizationFields: fields });
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                          placeholder="e.g., Favorite Activities"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Field Type</label>
                        <select
                          value={field.type}
                          onChange={(e) => {
                            const fields = [...(template.personalizationFields || [])];
                            fields[index] = { ...fields[index], type: e.target.value as any };
                            setTemplate({ ...template, personalizationFields: fields });
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Textarea</option>
                          <option value="number">Number</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Placeholder</label>
                        <input
                          type="text"
                          value={field.placeholder || ''}
                          onChange={(e) => {
                            const fields = [...(template.personalizationFields || [])];
                            fields[index] = { ...fields[index], placeholder: e.target.value };
                            setTemplate({ ...template, personalizationFields: fields });
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                          placeholder="Helpful hint for users..."
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => {
                            const fields = [...(template.personalizationFields || [])];
                            fields[index] = { ...fields[index], required: e.target.checked };
                            setTemplate({ ...template, personalizationFields: fields });
                          }}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">Required Field</label>
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => {
                            const fields = [...(template.personalizationFields || [])];
                            fields.splice(index, 1);
                            setTemplate({ ...template, personalizationFields: fields });
                          }}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Remove Field
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Field Button */}
                <button
                  onClick={() => {
                    const newField: PersonalizationField = {
                      name: '',
                      label: '',
                      type: 'text',
                      placeholder: '',
                      required: true
                    };
                    const fields = [...(template.personalizationFields || []), newField];
                    setTemplate({ ...template, personalizationFields: fields });
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Add Field
                </button>

                {/* Auto-generate from variables */}
                {extractedVariables.length > 0 && (
                  <button
                    onClick={() => {
                      const existingKeys = new Set((template.personalizationFields || []).map((f: PersonalizationField) => f.name));
                      const newFields = extractedVariables
                        .filter(v => !existingKeys.has(v))
                        .map(v => generateFieldConfig(v));

                      const fields = [...(template.personalizationFields || []), ...newFields];
                      setTemplate({ ...template, personalizationFields: fields });
                    }}
                    className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ml-2"
                  >
                    Auto-Generate Missing Fields
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Prompt Modal */}
      {template && (
        <TestPromptModal
          isOpen={isTestModalOpen}
          onClose={() => setIsTestModalOpen(false)}
          templateId={template.id}
          promptType={testPromptType}
          character={template.character || holidaySlug}
        />
      )}
    </div>
  );
}