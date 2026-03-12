'use client';

import { useState } from 'react';

interface ContentPreviewProps {
  letter: string;
  story: string;
  regenerationCount: number;
}

export default function ContentPreview({ letter, story, regenerationCount }: ContentPreviewProps) {
  const [activeTab, setActiveTab] = useState<'letter' | 'story'>('letter');

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

      {/* Tab Navigation */}
      <div className="w-full">
        <div className="flex border-b border-gray-200">
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
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === 'letter' && (
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

          {activeTab === 'story' && (
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