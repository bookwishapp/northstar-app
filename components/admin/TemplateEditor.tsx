'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Template {
  id: string;
  holidaySlug: string;
  character: string;
  location: string;
  letterPrompt: string;
  storyPrompt: string;
  backgroundKey: string | null;
  headerKey: string | null;
  characterKey: string | null;
  waxSealKey: string | null;
  signatureKey: string | null;
  isActive: boolean;
}

interface Props {
  template: Template;
}

export default function TemplateEditor({ template }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [formData, setFormData] = useState({
    character: template.character,
    location: template.location,
    letterPrompt: template.letterPrompt,
    storyPrompt: template.storyPrompt,
    isActive: template.isActive,
  });

  const [testPromptData, setTestPromptData] = useState({
    promptType: 'letter' as 'letter' | 'story',
    recipientName: 'Emma',
    recipientAge: 7,
    details: {},
  });

  const [testResult, setTestResult] = useState('');
  const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({});

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'prompts', label: 'AI Prompts' },
    { id: 'graphics', label: 'Graphics' },
    { id: 'test', label: 'Test Prompts' },
  ];

  const graphicSlots = [
    { id: 'background', label: 'Background', current: template.backgroundKey },
    { id: 'header', label: 'Header', current: template.headerKey },
    { id: 'character', label: 'Character', current: template.characterKey },
    { id: 'waxSeal', label: 'Wax Seal', current: template.waxSealKey },
    { id: 'signature', label: 'Signature', current: template.signatureKey },
  ];

  async function handleSave() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      router.refresh();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileUpload(slot: string, file: File) {
    setUploadStatus({ ...uploadStatus, [slot]: 'uploading' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('slot', slot);

    try {
      const response = await fetch(`/api/admin/templates/${template.id}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setUploadStatus({ ...uploadStatus, [slot]: 'success' });
      router.refresh();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({ ...uploadStatus, [slot]: 'error' });
    }
  }

  async function testPrompt() {
    setIsLoading(true);
    setTestResult('');

    try {
      const response = await fetch(`/api/admin/templates/${template.id}/test-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPromptData),
      });

      if (!response.ok) {
        throw new Error('Test failed');
      }

      const data = await response.json();
      setTestResult(data.result);
    } catch (error) {
      console.error('Test error:', error);
      alert('Failed to test prompt');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Character Name
              </label>
              <input
                type="text"
                value={formData.character}
                onChange={(e) => setFormData({ ...formData, character: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              />
            </div>

            <div className="flex items-center">
              <input
                id="isActive"
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Template is active
              </label>
            </div>
          </div>
        )}

        {/* Prompts Tab */}
        {activeTab === 'prompts' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Letter Prompt
              </label>
              <textarea
                value={formData.letterPrompt}
                onChange={(e) => setFormData({ ...formData, letterPrompt: e.target.value })}
                rows={10}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm font-mono"
                placeholder="Enter the system prompt for letter generation..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Story Prompt
              </label>
              <textarea
                value={formData.storyPrompt}
                onChange={(e) => setFormData({ ...formData, storyPrompt: e.target.value })}
                rows={10}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm font-mono"
                placeholder="Enter the system prompt for story generation..."
              />
            </div>
          </div>
        )}

        {/* Graphics Tab */}
        {activeTab === 'graphics' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-500">
              Upload graphics for different parts of the letter. Supported formats: JPG, PNG, WebP (max 5MB)
            </p>

            {graphicSlots.map((slot) => (
              <div key={slot.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-medium text-gray-900">{slot.label}</h3>
                  {slot.current && (
                    <span className="text-xs text-green-600">✓ Uploaded</span>
                  )}
                </div>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileUpload(slot.id, file);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                />

                {uploadStatus[slot.id] === 'uploading' && (
                  <p className="mt-2 text-sm text-blue-600">Uploading...</p>
                )}
                {uploadStatus[slot.id] === 'success' && (
                  <p className="mt-2 text-sm text-green-600">Upload successful!</p>
                )}
                {uploadStatus[slot.id] === 'error' && (
                  <p className="mt-2 text-sm text-red-600">Upload failed</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Test Tab */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Prompt Type
                </label>
                <select
                  value={testPromptData.promptType}
                  onChange={(e) => setTestPromptData({
                    ...testPromptData,
                    promptType: e.target.value as 'letter' | 'story'
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                >
                  <option value="letter">Letter</option>
                  <option value="story">Story</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Recipient Age
                </label>
                <input
                  type="number"
                  value={testPromptData.recipientAge}
                  onChange={(e) => setTestPromptData({
                    ...testPromptData,
                    recipientAge: parseInt(e.target.value)
                  })}
                  min="1"
                  max="100"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Recipient Name
              </label>
              <input
                type="text"
                value={testPromptData.recipientName}
                onChange={(e) => setTestPromptData({
                  ...testPromptData,
                  recipientName: e.target.value
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
              />
            </div>

            <button
              onClick={testPrompt}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test Prompt'}
            </button>

            {testResult && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Generated Result:</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {testResult}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}