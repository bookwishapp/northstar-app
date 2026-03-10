import { notFound } from 'next/navigation';
import ClaimForm from '@/components/claim/ClaimForm';

interface Props {
  params: Promise<{ token: string }>;
}

async function getOrderData(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');

  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BASE_URL not configured');
  }

  const response = await fetch(
    `${baseUrl}/api/claim/${token}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function ClaimPage({ params }: Props) {
  const { token } = await params;
  const data = await getOrderData(token);

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <ClaimForm
          token={token}
          order={data.order}
          template={data.template}
          program={data.program}
        />
      </div>
    </div>
  );
}