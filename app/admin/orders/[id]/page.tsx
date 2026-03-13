import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ResendEmailButton from './ResendEmailButton';

// Force dynamic rendering to prevent database calls during build
export const dynamic = 'force-dynamic';

async function getOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      program: {
        include: {
          template: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return order;
}

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  const claimUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/claim/${order.claimToken}`;

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Orders
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Order Details</h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Order Information
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            ID: {order.id}
          </p>
        </div>

        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  order.status === 'delivered'
                    ? 'bg-green-100 text-green-800'
                    : order.status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status}
                </span>
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Holiday</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.holidaySlug} ({order.program.template.character})
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Program</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.program.name} - {order.program.tier}
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Delivery Type</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.deliveryType}
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Order Source</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  order.source === 'website' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {order.source || 'admin'}
                </span>
              </dd>
            </div>

            {order.paymentStatus && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Payment Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    order.paymentStatus === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : order.paymentStatus === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.paymentStatus}
                  </span>
                  {order.paidAt && (
                    <span className="ml-2 text-sm text-gray-500">
                      on {new Date(order.paidAt).toLocaleString()}
                    </span>
                  )}
                </dd>
              </div>
            )}

            {order.subtotal !== null && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Order Total</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="space-y-1">
                    <div>Subtotal: ${(order.subtotal || 0).toFixed(2)}</div>
                    {order.shippingCost && order.shippingCost > 0 && (
                      <div>
                        Shipping ({order.shippingMethod}): ${order.shippingCost.toFixed(2)}
                      </div>
                    )}
                    {order.taxAmount && order.taxAmount > 0 && (
                      <div>Tax: ${order.taxAmount.toFixed(2)}</div>
                    )}
                    <div className="font-semibold pt-1 border-t border-gray-200">
                      Total: ${(order.totalAmount || order.subtotal || 0).toFixed(2)}
                    </div>
                  </div>
                </dd>
              </div>
            )}

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Customer Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.customerEmail || '-'}
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Customer Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.customerName || '-'}
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Recipient</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.recipientName ? `${order.recipientName}, Age ${order.recipientAge || '?'}` : '-'}
              </dd>
            </div>

            {order.billingAddress && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Billing Address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="text-sm">
                    <div>{(order.billingAddress as any).name}</div>
                    <div>{(order.billingAddress as any).line1}</div>
                    {(order.billingAddress as any).line2 && <div>{(order.billingAddress as any).line2}</div>}
                    <div>
                      {(order.billingAddress as any).city}, {(order.billingAddress as any).state} {(order.billingAddress as any).zip}
                    </div>
                    <div>{(order.billingAddress as any).country}</div>
                  </div>
                </dd>
              </div>
            )}

            {order.recipientAddress && order.deliveryType === 'physical' && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Shipping Address</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="text-sm">
                    <div>{(order.recipientAddress as any).name}</div>
                    <div>{(order.recipientAddress as any).line1}</div>
                    {(order.recipientAddress as any).line2 && <div>{(order.recipientAddress as any).line2}</div>}
                    <div>
                      {(order.recipientAddress as any).city}, {(order.recipientAddress as any).state} {(order.recipientAddress as any).zip}
                    </div>
                    <div>{(order.recipientAddress as any).country}</div>
                  </div>
                </dd>
              </div>
            )}

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">External Order ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.externalOrderId || '-'}
              </dd>
            </div>

            {order.stripeSessionId && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Stripe Payment Info</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="space-y-1">
                    <div className="text-xs">
                      <span className="font-medium">Session:</span> {order.stripeSessionId.slice(0, 30)}...
                    </div>
                    {order.stripePaymentIntentId && (
                      <div className="text-xs">
                        <span className="font-medium">Payment Intent:</span> {order.stripePaymentIntentId.slice(0, 30)}...
                      </div>
                    )}
                  </div>
                </dd>
              </div>
            )}

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Claim Token</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <code className="text-xs">{order.claimToken}</code>
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Claim URL</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <a
                  href={claimUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 hover:text-red-700 text-xs break-all"
                >
                  {claimUrl}
                </a>
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Claimed At</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {order.claimedAt ? new Date(order.claimedAt).toLocaleString() : 'Not claimed yet'}
              </dd>
            </div>

            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(order.createdAt).toLocaleString()}
              </dd>
            </div>

            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Updated</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(order.updatedAt).toLocaleString()}
              </dd>
            </div>

            {order.errorMessage && (
              <div className="bg-red-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Error</dt>
                <dd className="mt-1 text-sm text-red-700 sm:mt-0 sm:col-span-2">
                  {order.errorMessage}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-4 py-5 sm:px-6">
          <div className="flex space-x-3">
            {!order.claimedAt && order.customerEmail && (
              <ResendEmailButton
                orderId={order.id}
                customerEmail={order.customerEmail}
              />
            )}
            {order.generatedLetter && (
              <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                View Generated Content
              </button>
            )}
          </div>
        </div>

        {/* Generated Content Preview */}
        {order.generatedLetter && (
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Generated Content</h4>

            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Letter</h5>
                <div className="bg-gray-50 p-4 rounded text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {order.generatedLetter}
                </div>
              </div>

              {order.generatedStory && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Story</h5>
                  <div className="bg-gray-50 p-4 rounded text-sm text-gray-700 whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {order.generatedStory}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}