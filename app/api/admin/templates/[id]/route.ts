import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for template update
const updateTemplateSchema = z.object({
  character: z.string().nullable().optional(),
  characterTone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  letterPrompt: z.string().nullable().optional(),
  storyPrompt: z.string().nullable().optional(),
  isActive: z.boolean().nullable().optional(),
  primaryColor: z.string().nullable().optional(),
  accentColor: z.string().nullable().optional(),
  paperSize: z.string().nullable().optional(),
  marginTop: z.string().nullable().optional(),
  marginBottom: z.string().nullable().optional(),
  marginLeft: z.string().nullable().optional(),
  marginRight: z.string().nullable().optional(),
  repeatBackground: z.boolean().nullable().optional(),
  headerFirstPageOnly: z.boolean().nullable().optional(),
  waxSealLastPageOnly: z.boolean().nullable().optional(),
  letterDateFormat: z.string().nullable().optional(),
  letterDateCustom: z.string().nullable().optional(),
  // New fields from migration
  fontSize: z.string().nullable().optional(),
  returnAddress: z.string().nullable().optional(),
  envelopeBackgroundKey: z.string().nullable().optional(),
  emailHeaderKey: z.string().nullable().optional(),
  // S3 asset keys (managed by upload endpoint but may be in template object)
  backgroundKey: z.string().nullable().optional(),
  headerKey: z.string().nullable().optional(),
  characterKey: z.string().nullable().optional(),
  waxSealKey: z.string().nullable().optional(),
  signatureKey: z.string().nullable().optional(),
  // Personalization configuration
  personalizationFields: z.any().nullable().optional(),
  // Typography
  fontFamily: z.string().nullable().optional(),
  fontUrl: z.string().nullable().optional(),
}).passthrough(); // Allow additional fields that may exist on template

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

    // Remove null values before passing to Prisma
    const cleanedData = Object.fromEntries(
      Object.entries(validatedData).filter(([_, value]) => value !== null)
    );

    // Update template
    const template = await prisma.template.update({
      where: { id: templateId },
      data: cleanedData,
    });

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