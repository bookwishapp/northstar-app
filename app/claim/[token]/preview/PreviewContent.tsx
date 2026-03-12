'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  token: string;
  orderId: string;
  letter: string;
  story: string;
  recipientName: string;
  recipientAge: number | null;
  character: string;
  holidaySlug: string;
  regenerationCount: number;
  maxRegenerations: number;
}

export default function PreviewContent({
  token,
  orderId,
  letter,
  story,
  recipientName,
  recipientAge,
  character,
  holidaySlug,
  regenerationCount,
  maxRegenerations,
}: Props) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'letter' | 'story'>('letter');
  const [error, setError] = useState('');

  const canRegenerate = regenerationCount < maxRegenerations;
  const remainingRegenerations = maxRegenerations - regenerationCount;

  async function handleApprove() {
    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch(`/api/claim/${token}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve content');
      }

      // Redirect to success page
      router.push(`/claim/${token}/success`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsProcessing(false);
    }
  }

  async function handleRegenerate() {
    if (!canRegenerate) return;

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch(`/api/claim/${token}/regenerate`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to regenerate content');
      }

      // Reload the page to show new content
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsProcessing(false);
    }
  }

  return (
    <div className="p-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('letter')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'letter'
              ? 'bg-white text-red-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📜 Letter from {character}
        </button>
        <button
          onClick={() => setActiveTab('story')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'story'
              ? 'bg-white text-red-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📖 {recipientName}'s Story
        </button>
      </div>

      {/* Content Preview */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6 max-h-96 overflow-y-auto">
        <div className="prose prose-lg max-w-none">
          <div className="whitespace-pre-wrap font-serif text-gray-800">
            {activeTab === 'letter' ? letter : story}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Regeneration Info */}
      {canRegenerate && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700 text-sm">
            💡 Not quite right? You can regenerate the content {remainingRegenerations} more {remainingRegenerations === 1 ? 'time' : 'times'}.
            Each regeneration creates completely new content.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div>
          {canRegenerate && (
            <button
              onClick={handleRegenerate}
              disabled={isProcessing}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Processing...' : `🔄 Regenerate (${remainingRegenerations} left)`}
            </button>
          )}
        </div>

        <button
          onClick={handleApprove}
          disabled={isProcessing}
          className="px-8 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : '✅ Approve & Continue'}
        </button>
      </div>

      {/* Info Text */}
      <p className="mt-6 text-sm text-gray-500 text-center">
        Once approved, we'll create beautiful PDFs and send them to your email address.
      </p>
    </div>
  );
}