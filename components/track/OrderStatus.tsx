'use client';

interface OrderData {
  status: string;
  deliveryType: string;
  createdAt: string;
  claimedAt?: string;
  recipientName?: string;
  postgridLetterId?: string;
  errorMessage?: string;
}

interface Props {
  order: OrderData;
}

export default function OrderStatus({ order }: Props) {
  const statusSteps = [
    {
      key: 'pending_claim',
      label: 'Waiting for Personalization',
      description: 'Order created, waiting for you to personalize',
      icon: 'clipboard',
    },
    {
      key: 'pending_generation',
      label: 'Creating Content',
      description: 'Writing your magical letter and story',
      icon: 'pencil',
    },
    {
      key: 'pending_pdf',
      label: 'Preparing Documents',
      description: 'Generating beautiful PDFs',
      icon: 'document',
    },
    {
      key: 'pending_delivery',
      label: 'Ready to Send',
      description: order.deliveryType === 'physical'
        ? 'Preparing for physical mail delivery'
        : 'Getting ready to email',
      icon: 'envelope',
    },
    {
      key: 'delivered',
      label: 'Delivered',
      description: order.deliveryType === 'physical'
        ? 'Mailed to your address'
        : 'Sent to your email',
      icon: 'check',
    },
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.key === order.status);
  const isFailed = order.status === 'failed';

  function getIcon(iconName: string, isComplete: boolean, isCurrent: boolean) {
    const className = `w-6 h-6 ${
      isComplete ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'
    }`;

    switch (iconName) {
      case 'clipboard':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'pencil':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        );
      case 'document':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'envelope':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'check':
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-8">
      {/* Order Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Order Status: {isFailed ? 'Failed' : statusSteps[currentStepIndex]?.label || 'Unknown'}
        </h2>
        {order.recipientName && (
          <p className="text-gray-600">
            Letter for: <span className="font-medium">{order.recipientName}</span>
          </p>
        )}
        <p className="text-sm text-gray-500 mt-1">
          Created: {new Date(order.createdAt).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Status Message */}
      {(order.errorMessage || order.postgridLetterId) && (
        <div className={`mb-8 p-4 rounded-lg ${
          isFailed ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`text-sm font-medium ${
            isFailed ? 'text-red-800' : 'text-blue-800'
          }`}>
            {order.errorMessage || (order.postgridLetterId && `Tracking ID: ${order.postgridLetterId}`)}
          </p>
        </div>
      )}

      {/* Timeline */}
      {!isFailed && (
        <div className="relative">
          <div className="absolute left-8 top-8 bottom-0 w-0.5 bg-gray-200"></div>

          <div className="space-y-8">
            {statusSteps.map((step, index) => {
              const isComplete = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isPending = index > currentStepIndex;

              return (
                <div key={step.key} className="relative flex items-start">
                  {/* Icon */}
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${
                    isComplete ? 'bg-green-100' : isCurrent ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {getIcon(step.icon, isComplete, isCurrent)}
                  </div>

                  {/* Content */}
                  <div className="ml-6 flex-1">
                    <h3 className={`text-lg font-semibold ${
                      isComplete ? 'text-green-800' : isCurrent ? 'text-blue-800' : 'text-gray-400'
                    }`}>
                      {step.label}
                      {isComplete && (
                        <span className="ml-2 text-sm font-normal text-green-600">Complete</span>
                      )}
                      {isCurrent && (
                        <span className="ml-2 text-sm font-normal text-blue-600">In Progress</span>
                      )}
                    </h3>
                    <p className={`mt-1 text-sm ${
                      isPending ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Failed State */}
      {isFailed && (
        <div className="bg-red-50 rounded-lg p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Order Processing Failed
          </h3>
          <p className="text-sm text-red-600">
            There was an issue processing your order. Our team has been notified and will resolve this soon.
            Please contact support if you need immediate assistance.
          </p>
        </div>
      )}

      {/* Delivery Type Badge */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-gray-500">Delivery Method:</span>
            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              order.deliveryType === 'physical'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {order.deliveryType === 'physical' ? 'Physical Mail' : 'Digital Email'}
            </span>
          </div>

          {order.status === 'delivered' && (
            <div className="text-sm text-gray-500">
              <span>Delivered on: </span>
              <span className="font-medium text-gray-900">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}