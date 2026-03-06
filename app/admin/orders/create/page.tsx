import { prisma } from '@/lib/prisma';
import OrderCreateForm from '@/components/admin/OrderCreateForm';

async function getPrograms() {
  return prisma.program.findMany({
    where: { isActive: true },
    include: {
      template: true,
    },
    orderBy: { holidaySlug: 'asc' },
  });
}

export default async function CreateOrderPage() {
  const programs = await getPrograms();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Order</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create a new order for a customer
        </p>
      </div>

      <OrderCreateForm programs={programs} />
    </div>
  );
}