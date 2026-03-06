import { prisma } from '@/lib/prisma';

async function getHolidayStats() {
  const templates = await prisma.template.findMany({
    include: {
      programs: {
        include: {
          _count: {
            select: { orders: true },
          },
        },
      },
    },
  });

  // Group by holiday
  const holidays = templates.reduce((acc, template) => {
    if (!acc[template.holidaySlug]) {
      acc[template.holidaySlug] = {
        slug: template.holidaySlug,
        templates: [],
        totalOrders: 0,
        totalPrograms: 0,
      };
    }

    const orderCount = template.programs.reduce((sum, p) => sum + p._count.orders, 0);
    acc[template.holidaySlug].templates.push(template);
    acc[template.holidaySlug].totalOrders += orderCount;
    acc[template.holidaySlug].totalPrograms += template.programs.length;

    return acc;
  }, {} as Record<string, any>);

  return Object.values(holidays);
}

export default async function HolidaysPage() {
  const holidays = await getHolidayStats();

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Holidays</h1>
          <p className="mt-2 text-sm text-gray-700">
            Overview of all holiday campaigns
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {holidays.map((holiday) => (
          <div
            key={holiday.slug}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 capitalize mb-4">
                {holiday.slug}
              </h3>

              <dl className="grid grid-cols-1 gap-3">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Templates</dt>
                  <dd className="text-sm text-gray-900">{holiday.templates.length}</dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Programs</dt>
                  <dd className="text-sm text-gray-900">{holiday.totalPrograms}</dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-500">Total Orders</dt>
                  <dd className="text-sm text-gray-900">{holiday.totalOrders}</dd>
                </div>
              </dl>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Characters</h4>
                <div className="flex flex-wrap gap-1">
                  {holiday.templates.map((template: any) => (
                    <span
                      key={template.id}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {template.character}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          Adding New Holidays
        </h3>
        <p className="text-sm text-blue-700">
          To add a new holiday:
        </p>
        <ol className="mt-2 text-sm text-blue-700 list-decimal list-inside space-y-1">
          <li>Create a new Template with the holiday slug</li>
          <li>Upload graphics for the template</li>
          <li>Configure AI prompts for letter and story generation</li>
          <li>Create Programs with different tiers (basic, deluxe, premium)</li>
          <li>Test the prompts before activating</li>
        </ol>
      </div>
    </div>
  );
}