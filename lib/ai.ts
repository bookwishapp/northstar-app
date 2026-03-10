import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import { processPromptTemplate, buildPromptContext } from '@/lib/prompt-template';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
 * Generate personalized letter and story content using OpenAI
 */
export async function generateContent(orderId: string): Promise<GeneratedContent> {
  console.log(`Generating content for order ${orderId}...`);

  const order = await getOrderWithTemplate(orderId);
  const { program: { template }, recipientName, recipientAge, recipientDetails } = order;

  if (!recipientName) {
    throw new Error(`Order ${orderId} missing recipient name`);
  }

  // Build context object for Handlebars processing
  const context = buildPromptContext(
    recipientName,
    recipientAge,
    recipientDetails
  );

  console.log('Recipient context:', JSON.stringify(context, null, 2));

  // Process Handlebars templates
  const processedLetterPrompt = processPromptTemplate(template.letterPrompt, context);
  const processedStoryPrompt = processPromptTemplate(template.storyPrompt, context);

  try {
    // Generate letter and story in parallel
    const [letterResponse, storyResponse] = await Promise.all([
      openai.chat.completions.create({
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
      openai.chat.completions.create({
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