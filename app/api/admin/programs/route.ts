import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createProgramSchema = z.object({
  holidaySlug: z.string(),
  name: z.string(),
  tier: z.string(),
  deliveryTypes: z.array(z.string()),
  productTypes: z.array(z.string()).optional().default(['letter', 'story']),
  priceDigital: z.number().nullable(),
  pricePhysical: z.number().nullable(),
  isActive: z.boolean(),
});

const updateProgramSchema = z.object({
  name: z.string().optional(),
  tier: z.string().optional(),
  deliveryTypes: z.array(z.string()).optional(),
  productTypes: z.array(z.string()).optional(),
  priceDigital: z.number().nullable().optional(),
  pricePhysical: z.number().nullable().optional(),
  isActive: z.boolean().optional(),
  templateId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      // Get single program
      const program = await prisma.program.findUnique({
        where: { id },
        include: {
          template: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!program) {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 });
      }

      return NextResponse.json(program);
    }

    // Get all programs
    const programs = await prisma.program.findMany({
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json({ programs });
  } catch (error) {
    console.error('Failed to fetch programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
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

export async function PUT(request: NextRequest) {
  try {
    const { prisma } = await import('@/lib/prisma');
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Program ID required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateProgramSchema.parse(body);

    const program = await prisma.program.update({
      where: { id },
      data: validatedData,
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
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

    console.error('Failed to update program:', error);
    return NextResponse.json(
      { error: 'Failed to update program' },
      { status: 500 }
    );
  }
}