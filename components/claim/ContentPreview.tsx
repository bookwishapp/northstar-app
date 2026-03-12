'use client';

import { useState } from 'react';

interface ContentPreviewProps {
  letter: string;
  story: string;
  regenerationCount: number;
  productTypes?: string[];
}

export default function ContentPreview({ letter, story, regenerationCount, productTypes = ['letter', 'story'] }: ContentPreviewProps) {
  // Only show tabs that are included in the product
  const showLetter = productTypes.includes('letter');
  const showStory = productTypes.includes('story');

  // Set initial tab to first available product type
  const [activeTab, setActiveTab] = useState<'letter' | 'story'>(
    showLetter ? 'letter' : 'story'
  );

  // Format content with proper line breaks
  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="space-y-4">
      {regenerationCount > 0 && (
        <div className="text-sm text-gray-500">
          Regeneration {regenerationCount} of 3
        </div>
      )}

      {/* Tab Navigation - only show if both products are included */}
      <div className="w-full">
        {showLetter && showStory ? (
          <div className="flex border-b border-gray-200">
            {showLetter && (
              <button
                onClick={() => setActiveTab('letter')}
                className={`flex-1 py-2 px-4 text-center font-medium transition-colors ${
                  activeTab === 'letter'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Letter Preview
              </button>
            )}
            {showStory && (
              <button
                onClick={() => setActiveTab('story')}
                className={`flex-1 py-2 px-4 text-center font-medium transition-colors ${
                  activeTab === 'story'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Personalized Story
              </button>
            )}
          </div>
        ) : (
          // Single product - show as title without tabs
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {showLetter ? 'Letter Preview' : 'Personalized Story'}
            </h3>
          </div>
        )}

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'letter' && showLetter && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap font-serif text-gray-800">
                    {formatContent(letter)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'story' && showStory && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap font-serif text-gray-800">
                    {formatContent(story)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Please review the content above. You can either:
        </p>
        <ul className="text-sm text-gray-600 mt-2 ml-4 list-disc">
          <li>Approve and send the letter as-is</li>
          {regenerationCount < 3 && (
            <li>Edit the details below and regenerate for different content</li>
          )}
        </ul>
      </div>
    </div>
  );
}