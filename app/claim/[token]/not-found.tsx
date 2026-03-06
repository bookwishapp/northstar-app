import Link from 'next/link';

export default function ClaimNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-xl rounded-lg p-8 text-center">
          {/* Error Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full">
              <svg
                className="w-12 h-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Invalid or Expired Link
          </h1>

          <p className="text-gray-600 mb-6">
            This claim link is invalid or has already been used. Each order can only be
            personalized once.
          </p>

          {/* Possible Reasons */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm font-medium text-gray-900 mb-2">Possible reasons:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• The link has already been used</li>
              <li>• The link was typed incorrectly</li>
              <li>• The order has expired</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full py-3 px-4 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Go to Homepage
            </Link>
            <a
              href="mailto:hello@northstarpostal.com"
              className="block w-full py-3 px-4 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}