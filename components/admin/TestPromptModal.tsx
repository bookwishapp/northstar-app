'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TestPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  promptType: 'letter' | 'story';
  character: string;
}

export default function TestPromptModal({
  isOpen,
  onClose,
  templateId,
  promptType,
  character,
}: TestPromptModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [recipientName, setRecipientName] = useState('');
  const [recipientAge, setRecipientAge] = useState('');
  const [details, setDetails] = useState('');

  async function handleTest() {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Parse details into key-value pairs
      const detailsObj: Record<string, string> = {};
      if (details) {
        details.split('\n').forEach(line => {
          const [key, ...valueParts] = line.split(':');
          if (key && valueParts.length > 0) {
            detailsObj[key.trim()] = valueParts.join(':').trim();
          }
        });
      }

      const response = await fetch(`/api/admin/templates/${templateId}/test-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptType,
          recipientName,
          recipientAge: parseInt(recipientAge),
          details: detailsObj,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.result);
      } else {
        setError(data.error || 'Failed to generate test content');
      }
    } catch (err) {
      setError('Failed to connect to the server');
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setResult(null);
    setError(null);
    setRecipientName('');
    setRecipientAge('');
    setDetails('');
    onClose();
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                        Test {promptType === 'letter' ? 'Letter' : 'Story'} Prompt
                      </Dialog.Title>

                      {!result ? (
                        <div className="mt-4 space-y-4">
                          <div>
                            <label htmlFor="recipientName" className="block text-sm font-medium text-gray-700">
                              Recipient Name
                            </label>
                            <input
                              type="text"
                              id="recipientName"
                              value={recipientName}
                              onChange={(e) => setRecipientName(e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                              placeholder="e.g., Emma"
                            />
                          </div>

                          <div>
                            <label htmlFor="recipientAge" className="block text-sm font-medium text-gray-700">
                              Recipient Age
                            </label>
                            <input
                              type="number"
                              id="recipientAge"
                              value={recipientAge}
                              onChange={(e) => setRecipientAge(e.target.value)}
                              min="1"
                              max="100"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                              placeholder="e.g., 7"
                            />
                          </div>

                          <div>
                            <label htmlFor="details" className="block text-sm font-medium text-gray-700">
                              Personalization Details
                            </label>
                            <textarea
                              id="details"
                              value={details}
                              onChange={(e) => setDetails(e.target.value)}
                              rows={4}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                              placeholder="Enter details, one per line:
Favorite color: Blue
Pet: Dog named Max
Hobbies: Drawing, soccer"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Enter personalization details as key: value pairs, one per line
                            </p>
                          </div>

                          {error && (
                            <div className="rounded-md bg-red-50 p-4">
                              <p className="text-sm text-red-800">{error}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4">
                          <div className="rounded-lg bg-gray-50 p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">
                              Generated {promptType === 'letter' ? 'Letter' : 'Story'} from {character}:
                            </h4>
                            <div className="mt-2 whitespace-pre-wrap text-sm text-gray-700 font-mono max-h-96 overflow-y-auto">
                              {result}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  {!result ? (
                    <>
                      <button
                        type="button"
                        disabled={isLoading || !recipientName || !recipientAge}
                        onClick={handleTest}
                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? 'Generating...' : 'Generate'}
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setResult(null)}
                        className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                      >
                        Test Again
                      </button>
                      <button
                        type="button"
                        onClick={handleClose}
                        className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                      >
                        Close
                      </button>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}