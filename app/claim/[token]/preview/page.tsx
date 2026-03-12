import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PreviewContent from './PreviewContent';
import { ensureContentApprovalFields } from '@/lib/migrations';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function PreviewPage({ params }: Props) {
  const { token } = await params;

  // Ensure migration is applied
  await ensureContentApprovalFields();

  // Fetch the order to get the generated content
  const order = await prisma.order.findUnique({
    where: { claimToken: token },
    select: {
      id: true,
      status: true,
      generatedLetter: true,
      generatedStory: true,
      regenerationCount: true,
      contentApprovedAt: true,
      recipientName: true,
      recipientAge: true,
      program: {
        include: {
          template: {
            select: {
              character: true,
              holidaySlug: true,
            },
          },
        },
      },
    },
  });

  // Handle various states
  if (!order) {
    notFound();
  }

  // If already approved, redirect to success page
  if (order.contentApprovedAt) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Content Already Approved
          </h1>
          <p className="text-gray-600">
            This letter has already been approved and is being processed.
          </p>
          <a
            href={`/claim/${token}/success`}
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            Go to success page →
          </a>
        </div>
      </div>
    );
  }

  // If content not yet generated
  if (!order.generatedLetter || !order.generatedStory) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          <div className="animate-pulse">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Creating Your Magical Letter...
            </h1>
            <p className="text-gray-600">
              Please wait while we generate your personalized content.
              This usually takes 10-30 seconds.
            </p>
          </div>
          <script dangerouslySetInnerHTML={{
            __html: `setTimeout(() => window.location.reload(), 5000);`
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-green-600 text-white p-6">
            <h1 className="text-2xl font-bold">Preview Your Magical Letter</h1>
            <p className="mt-2 text-red-100">
              Review the generated content below. You can regenerate it up to {3 - order.regenerationCount} more times if needed.
            </p>
          </div>

          {/* Preview Component */}
          <PreviewContent
            token={token}
            orderId={order.id}
            letter={order.generatedLetter}
            story={order.generatedStory}
            recipientName={order.recipientName!}
            recipientAge={order.recipientAge}
            character={order.program.template.character}
            holidaySlug={order.program.template.holidaySlug}
            regenerationCount={order.regenerationCount}
            maxRegenerations={3}
          />
        </div>
      </div>
    </div>
  );
}