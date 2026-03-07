import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const holidaySlug = searchParams.get('holidaySlug');

    if (!holidaySlug) {
      return NextResponse.json({ error: 'holidaySlug is required' }, { status: 400 });
    }

    const template = await prisma.template.findFirst({
      where: { holidaySlug },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Failed to fetch template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}