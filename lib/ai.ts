import OpenAI from 'openai';
import { processPromptTemplate, buildPromptContext } from '@/lib/prompt-template';

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
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
 * Generate personalized letter and story content using OpenAI
 */
export async function generateContent(orderId: string): Promise<GeneratedContent> {
  console.log(`Generating content for order ${orderId}...`);

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
    // Generate letter and story in parallel
    const [letterResponse, storyResponse] = await Promise.all([
      getOpenAIClient().chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: processedLetterPrompt,
          },
          {
            role: 'user',
            content: `Generate a personalized letter for ${recipientName}.`,
          },
        ],
        temperature: 0.9,
        max_tokens: 800,
      }),
      getOpenAIClient().chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: processedStoryPrompt,
          },
          {
            role: 'user',
            content: `Generate a personalized story featuring ${recipientName}.`,
          },
        ],
        temperature: 0.9,
        max_tokens: 1200,
      }),
    ]);

    const letter = letterResponse.choices[0]?.message?.content;
    const story = storyResponse.choices[0]?.message?.content;

    if (!letter || !story) {
      throw new Error('Failed to generate content from OpenAI');
    }

    console.log(`Content generated successfully for order ${orderId}`);
    console.log(`Letter length: ${letter.length} chars`);
    console.log(`Story length: ${story.length} chars`);

    return {
      letter: letter.trim(),
      story: story.trim(),
    };
  } catch (error) {
    console.error('OpenAI generation failed:', error);
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