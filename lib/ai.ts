import Anthropic from '@anthropic-ai/sdk';
import { processPromptTemplate, buildPromptContext } from '@/lib/prompt-template';

// Lazy initialization of Anthropic client
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured in environment variables');
    }
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

interface RecipientDetails {
  recipientName: string;
  recipientAge?: number;
  recipientDetails?: Record<string, any>;
}

interface GeneratedContent {
  letter: string;
  story: string;
}

/**
 * Get order with template information
 */
async function getOrderWithTemplate(orderId: string) {
  const { prisma } = await import('@/lib/prisma');
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      program: {
        include: {
          template: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  if (!order.program || !order.program.template) {
    throw new Error(`Order ${orderId} missing program or template`);
  }

  return order;
}

/**
 * Determine the letter date based on template configuration
 */
function getLetterDate(template: any): string {
  const format = template.letterDateFormat;

  if (format === 'custom' && template.letterDateCustom) {
    return template.letterDateCustom;
  }

  if (format === 'holiday') {
    const holidayDates: Record<string, string> = {
      'christmas': 'December 25',
      'easter': 'Easter Sunday',
      'birthday': 'Today',
      'valentines': 'February 14',
      'halloween': 'October 31',
    };
    return holidayDates[template.holidaySlug] || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

/**
 * Generate personalized letter and story content using Anthropic's Claude
 */
export async function generateContent(orderId: string): Promise<GeneratedContent> {
  console.log(`Generating content for order ${orderId} using Claude Sonnet...`);

  const order = await getOrderWithTemplate(orderId);
  const { program: { template }, recipientName, recipientAge, recipientDetails } = order;

  if (!recipientName) {
    throw new Error(`Order ${orderId} missing recipient name`);
  }

  const letterDate = getLetterDate(template);

  const context = buildPromptContext(
    recipientName,
    recipientAge,
    recipientDetails,
    letterDate
  );

  console.log('Recipient context:', JSON.stringify(context, null, 2));

  const processedLetterPrompt = processPromptTemplate(template.letterPrompt, context);
  const processedStoryPrompt = processPromptTemplate(template.storyPrompt, context);

  try {
    // Using Claude 3.5 Sonnet - the latest and best model for creative writing
    const model = 'claude-3-5-sonnet-20241022';
    console.log(`Using Anthropic model: ${model}`);

    // Generate letter and story in parallel
    const [letterResponse, storyResponse] = await Promise.all([
      getAnthropicClient().messages.create({
        model: model,
        max_tokens: 1000,
        temperature: 0.9,
        system: processedLetterPrompt,
        messages: [
          {
            role: 'user',
            content: `Generate a personalized, heartwarming letter for ${recipientName}. Make it magical, engaging, and age-appropriate for a ${recipientAge || 'young'} year old. Include specific details that make it feel truly personal.`,
          },
        ],
      }),
      getAnthropicClient().messages.create({
        model: model,
        max_tokens: 1500,
        temperature: 0.9,
        system: processedStoryPrompt,
        messages: [
          {
            role: 'user',
            content: `Generate a captivating, personalized story featuring ${recipientName} as the main character. Make it adventurous, magical, and age-appropriate for a ${recipientAge || 'young'} year old. Include vivid descriptions and engaging plot that will capture their imagination.`,
          },
        ],
      }),
    ]);

    // Extract text from Claude's response format
    const letter = letterResponse.content[0].type === 'text'
      ? letterResponse.content[0].text
      : '';
    const story = storyResponse.content[0].type === 'text'
      ? storyResponse.content[0].text
      : '';

    if (!letter || !story) {
      throw new Error('Failed to generate content from Claude');
    }

    console.log(`Content generated successfully for order ${orderId}`);
    console.log(`Letter length: ${letter.length} chars`);
    console.log(`Story length: ${story.length} chars`);
    console.log(`Model used: ${model}`);

    return {
      letter: letter.trim(),
      story: story.trim(),
    };
  } catch (error) {
    console.error('Anthropic generation failed:', error);

    // Log specific error details for debugging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
    }

    throw new Error(`Failed to generate AI content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save generated content to the order
 */
export async function saveGeneratedContent(
  orderId: string,
  letter: string,
  story: string
): Promise<void> {
  const { prisma } = await import('@/lib/prisma');
  await prisma.order.update({
    where: { id: orderId },
    data: {
      generatedLetter: letter,
      generatedStory: story,
    },
  });

  console.log(`Saved generated content for order ${orderId}`);
}

/**
 * Generate and save content for an order
 */
export async function generateAndSaveContent(orderId: string): Promise<GeneratedContent> {
  const content = await generateContent(orderId);
  await saveGeneratedContent(orderId, content.letter, content.story);
  return content;
}