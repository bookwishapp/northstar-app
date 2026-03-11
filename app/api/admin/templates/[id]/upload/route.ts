import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadToS3, getPresignedDownloadUrl } from '@/lib/s3';
import { z } from 'zod';

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB - increased for high-quality backgrounds

/**
 * POST /api/admin/templates/[id]/upload
 * Upload graphics for template
 * Protected by admin session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add admin authentication check here

    const { id: templateId } = await params;

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const slot = formData.get('slot') as string;

    // Validate slot
    const validSlots = ['background', 'header', 'character', 'waxSeal', 'signature', 'envelopeBackground', 'emailHeader'];
    if (!validSlots.includes(slot)) {
      return NextResponse.json(
        { error: 'Invalid slot type' },
        { status: 400 }
      );
    }

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 20MB' },
        { status: 400 }
      );
    }

    // Get template to verify it exists and get holiday slug
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine file extension
    const extension = file.type.split('/')[1].replace('jpeg', 'jpg');

    // Build S3 key based on slot
    const s3Key = `templates/${template.holidaySlug}/${slot}.${extension}`;

    // Upload to S3
    await uploadToS3(buffer, s3Key, file.type);

    // Update template with new key
    const updateData: any = {};
    const keyFieldMap: Record<string, string> = {
      background: 'backgroundKey',
      header: 'headerKey',
      character: 'characterKey',
      waxSeal: 'waxSealKey',
      signature: 'signatureKey',
      envelopeBackground: 'envelopeBackgroundKey',
      emailHeader: 'emailHeaderKey',
    };

    updateData[keyFieldMap[slot]] = s3Key;

    await prisma.template.update({
      where: { id: templateId },
      data: updateData,
    });

    // Generate preview URL
    const previewUrl = await getPresignedDownloadUrl(s3Key, 3600); // 1 hour

    return NextResponse.json({
      success: true,
      key: s3Key,
      previewUrl,
    });

  } catch (error) {
    console.error('Failed to upload template graphic:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to upload graphic: ${errorMessage}` },
      { status: 500 }
    );
  }
}