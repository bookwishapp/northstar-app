import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import OrderDetailsComponent from '@/components/orders/OrderDetails';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getOrder(id: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        program: {
          include: {
            holiday: true,
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    return order;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export default async function OrderDetailsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const order = await getOrder(resolvedParams.id);

  if (!order) {
    notFound();
  }

  return <OrderDetailsComponent order={order} />;
}