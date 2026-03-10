import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { z } from 'zod';
import { processPromptTemplate, buildPromptContext } from '@/lib/prompt-template';

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Add admin authentication check here

    const { id: templateId } = await params;
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

    // Build context object for Handlebars processing
    const context = buildPromptContext(
      validatedData.recipientName,
      validatedData.recipientAge,
      validatedData.details
    );

    // Select prompt template based on type
    const promptTemplate = validatedData.promptType === 'letter'
      ? template.letterPrompt
      : template.storyPrompt;

    // Process the Handlebars template with the context
    const processedPrompt = processPromptTemplate(promptTemplate, context);

    // Generate test content
    console.log(`Testing ${validatedData.promptType} prompt for template ${templateId}`);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: processedPrompt,
        },
        {
          role: 'user',
          content: `Generate a ${validatedData.promptType} for ${validatedData.recipientName}.`,
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

