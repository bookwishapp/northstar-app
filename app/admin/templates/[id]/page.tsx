import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import TemplateEditor from '@/components/admin/TemplateEditor';

// Force dynamic rendering to prevent database calls during build
export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

async function getTemplate(id: string) {
  const template = await prisma.template.findUnique({
    where: { id },
  });

  if (!template) {
    notFound();
  }

  return template;
}

export default async function EditTemplatePage({ params }: Props) {
  const { id } = await params;
  const template = await getTemplate(id);

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Edit Template: {template.character}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Holiday: {template.holidaySlug}
        </p>
      </div>

      <TemplateEditor template={template} />
    </div>
  );
}