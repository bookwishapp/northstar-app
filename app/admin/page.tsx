import { prisma } from '@/lib/prisma';
import Link from 'next/link';

// Force dynamic rendering to prevent database calls during build
export const dynamic = 'force-dynamic';

async function getStats() {
  const [totalOrders, pendingOrders, deliveredOrders, totalTemplates, totalPrograms] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { startsWith: 'pending' } } }),
    prisma.order.count({ where: { status: 'delivered' } }),
    prisma.template.count(),
    prisma.program.count(),
  ]);

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      program: {
        include: {
          template: true,
        },
      },
    },
  });

  return {
    totalOrders,
    pendingOrders,
    deliveredOrders,
    totalTemplates,
    totalPrograms,
    recentOrders,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, href: '/admin/orders' },
    { label: 'Pending Orders', value: stats.pendingOrders, href: '/admin/orders?status=pending' },
    { label: 'Delivered Orders', value: stats.deliveredOrders, href: '/admin/orders?status=delivered' },
    { label: 'Templates', value: stats.totalTemplates, href: '/admin/holidays' },
    { label: 'Programs', value: stats.totalPrograms, href: '/admin/holidays' },
  ];

  return (
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {statCards.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                {stat.label}
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {stat.value}
              </dd>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Link
              href="/admin/orders/create"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              Create Order
            </Link>
            <Link
              href="/admin/holidays/create"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              New Holiday
            </Link>
            <Link
              href="/admin/holidays"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Manage Holidays
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Orders
            </h3>
            <Link
              href="/admin/orders"
              className="text-sm text-red-600 hover:text-red-700"
            >
              View all
            </Link>
          </div>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Holiday
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-red-600 hover:text-red-700"
                      >
                        {order.id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customerName || 'Unclaimed'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.program.template.character}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === 'delivered'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}