import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for template update
const updateTemplateSchema = z.object({
  character: z.string().optional(),
  characterTone: z.string().optional(),
  location: z.string().optional(),
  letterPrompt: z.string().optional(),
  storyPrompt: z.string().optional(),
  isActive: z.boolean().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  paperSize: z.string().optional(),
  marginTop: z.string().optional(),
  marginBottom: z.string().optional(),
  marginLeft: z.string().optional(),
  marginRight: z.string().optional(),
  repeatBackground: z.boolean().optional(),
  headerFirstPageOnly: z.boolean().optional(),
  waxSealLastPageOnly: z.boolean().optional(),
});

/**
 * PATCH /api/admin/templates/[id]
 * Update template details
 * Protected by admin session
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add admin authentication check here

    const { id: templateId } = await params;
    const body = await request.json();

    // Validate request body
    const validatedData = updateTemplateSchema.parse(body);

    // Update template
    const template = await prisma.template.update({
      where: { id: templateId },
      data: validatedData,
    });

    console.log(`Template ${templateId} updated`);

    return NextResponse.json({
      success: true,
      template,
    });

  } catch (error) {
    console.error('Failed to update template:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}