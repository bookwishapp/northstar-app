import { prisma } from '@/lib/prisma';
import Link from 'next/link';

// Force dynamic rendering to prevent database calls during build
export const dynamic = 'force-dynamic';

async function getPrograms(holidaySlug: string) {
  const programs = await prisma.program.findMany({
    where: { holidaySlug },
    include: {
      _count: {
        select: { orders: true },
      },
      template: true,
    },
    orderBy: { name: 'asc' },
  });
  return programs;
}

export default async function HolidayProgramsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: holidaySlug } = await params;
  const programs = await getPrograms(holidaySlug);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900 capitalize">
            {holidaySlug?.replace(/_/g, ' ') || ''} Programs
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage programs and pricing for this holiday
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href={`/admin/holidays/${holidaySlug}/programs/new`}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Program
          </Link>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Program Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Tier
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Delivery Types
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Digital Price
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Physical Price
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Orders
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {programs.map((program) => (
                    <tr key={program.id}>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {program.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          program.tier === 'deluxe'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {program.tier}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {program.deliveryTypes.join(', ')}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {program.priceDigital ? `$${program.priceDigital.toFixed(2)}` : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {program.pricePhysical ? `$${program.pricePhysical.toFixed(2)}` : '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {program._count.orders}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          program.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {program.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <Link
                          href={`/admin/holidays/${holidaySlug}/programs/${program.id}/edit`}
                          className="text-red-600 hover:text-red-900"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {programs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500">
                    No programs yet for this holiday.
                  </p>
                  <Link
                    href={`/admin/holidays/${holidaySlug}/programs/new`}
                    className="mt-2 inline-flex items-center text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Add your first program →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}