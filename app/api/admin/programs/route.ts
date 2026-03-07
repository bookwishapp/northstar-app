import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createProgramSchema = z.object({
  holidaySlug: z.string(),
  name: z.string(),
  tier: z.string(),
  deliveryTypes: z.array(z.string()),
  priceDigital: z.number().nullable(),
  pricePhysical: z.number().nullable(),
  isActive: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createProgramSchema.parse(body);

    // Find template for this holiday
    const template = await prisma.template.findFirst({
      where: { holidaySlug: validatedData.holidaySlug },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found for this holiday' },
        { status: 404 }
      );
    }

    const program = await prisma.program.create({
      data: {
        ...validatedData,
        templateId: template.id,
      },
    });

    return NextResponse.json(program);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to create program:', error);
    return NextResponse.json(
      { error: 'Failed to create program' },
      { status: 500 }
    );
  }
}