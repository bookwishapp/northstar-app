import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Schema for test prompt request
const testPromptSchema = z.object({
  promptType: z.enum(['letter', 'story']),
  recipientName: z.string().min(1),
  recipientAge: z.number().int().min(1).max(100),
  details: z.record(z.string()).optional(),
});

/**
 * POST /api/admin/templates/[id]/test-prompt
 * Test AI prompts without creating an order
 * Protected by admin session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Add admin authentication check here

    const { id: templateId } = params;
    const body = await request.json();

    // Validate request body
    const validatedData = testPromptSchema.parse(body);

    // Get template
    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Build recipient context
    const recipientContext = buildTestContext(
      validatedData.recipientName,
      validatedData.recipientAge,
      validatedData.details
    );

    // Select prompt based on type
    const systemPrompt = validatedData.promptType === 'letter'
      ? template.letterPrompt
      : template.storyPrompt;

    // Generate test content
    console.log(`Testing ${validatedData.promptType} prompt for template ${templateId}`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: recipientContext,
        },
      ],
      temperature: 0.9,
      max_tokens: validatedData.promptType === 'letter' ? 800 : 1200,
    });

    const result = response.choices[0]?.message?.content;

    if (!result) {
      throw new Error('No content generated from OpenAI');
    }

    return NextResponse.json({
      success: true,
      result: result.trim(),
      tokensUsed: response.usage?.total_tokens || 0,
    });

  } catch (error) {
    console.error('Failed to test prompt:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to test prompt' },
      { status: 500 }
    );
  }
}

/**
 * Build context for test generation
 */
function buildTestContext(
  recipientName: string,
  recipientAge: number,
  details?: Record<string, any>
): string {
  const parts = [
    `Child's name: ${recipientName}`,
    `Age: ${recipientAge} years old`,
  ];

  if (details) {
    Object.entries(details).forEach(([key, value]) => {
      if (value) {
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .trim();
        parts.push(`${label}: ${value}`);
      }
    });
  }

  return parts.join('\n');
}