import Anthropic from '@anthropic-ai/sdk';
import { processPromptTemplate, buildPromptContext } from '@/lib/prompt-template';

// Lazy initialization of Anthropic client
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Log key info for debugging (first/last few chars only for security)
    const keyPreview = apiKey.length > 10
      ? `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`
      : 'KEY_TOO_SHORT';
    console.log(`Initializing Anthropic client with API key: ${keyPreview}`);
    console.log(`API Key length: ${apiKey.length} characters`);

    try {
      anthropicClient = new Anthropic({
        apiKey: apiKey,
        timeout: 30000, // 30 second timeout
        maxRetries: 2, // Retry up to 2 times on network errors
      });
      console.log('Anthropic client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Anthropic client:', error);
      throw error;
    }
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

  // Log prompt sizes for debugging
  console.log(`Letter prompt length: ${processedLetterPrompt.length} chars`);
  console.log(`Story prompt length: ${processedStoryPrompt.length} chars`);

  // Anthropic models for creative writing:
  // - claude-sonnet-4-6: Best for creative writing (default)
  // - claude-haiku-4-5-20251001: Faster, cheaper, still good
  // - claude-opus-4-6: Previous best, very capable
  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
  console.log(`Using Anthropic model: ${model}`);

  const client = getAnthropicClient();
  console.log('Anthropic client obtained, starting API calls...');

  const startTime = Date.now();

  // Create the API call promises with additional logging
  const letterPromise = client.messages.create({
    model: model,
    max_tokens: 1000,
    temperature: 0.9,
    system: processedLetterPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate a personalized, heartwarming letter for ${recipientName}. Make it magical, engaging, and age-appropriate for a ${recipientAge || 'young'} year old. Include specific details that make it feel truly personal.

IMPORTANT:
- Write ONLY the letter content itself, starting with "Dear ${recipientName},"
- Do NOT include any asterisks, stage directions, or formatting marks
- Do NOT include headers like "A Letter for..." or "Delivered to..."
- Do NOT use asterisks for emphasis - use natural language instead
- Write in a natural, flowing narrative style as if speaking directly to the child`,
      },
    ],
  }).then(res => {
    console.log('Letter generation completed');
    console.log('Letter model used:', res.model); // Log actual model from response
    return res;
  }).catch(err => {
    console.error('Letter generation failed:', err);
    throw err;
  });

  const storyPromise = client.messages.create({
    model: model,
    max_tokens: 1500,
    temperature: 0.9,
    system: processedStoryPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate a captivating, personalized story featuring ${recipientName} as the main character. Make it adventurous, magical, and age-appropriate for a ${recipientAge || 'young'} year old. Include vivid descriptions and engaging plot that will capture their imagination.

IMPORTANT:
- Write ONLY the story narrative itself
- Do NOT include any asterisks, stage directions, or formatting marks
- Do NOT use asterisks for emphasis or scene breaks
- Write in a smooth, flowing narrative style
- Use natural paragraph breaks without any special symbols`,
      },
    ],
  }).then(res => {
    console.log('Story generation completed');
    console.log('Story model used:', res.model); // Log actual model from response
    return res;
  }).catch(err => {
    console.error('Story generation failed:', err);
    throw err;
  });

  console.log('Waiting for both generations to complete...');
  // Generate letter and story in parallel with individual error handling
  const [letterResult, storyResult] = await Promise.allSettled([letterPromise, storyPromise]);

  const generationTime = Date.now() - startTime;
  console.log(`AI generation completed in ${generationTime}ms`);

  // Check for failures
  if (letterResult.status === 'rejected') {
    console.error('Letter generation failed:', letterResult.reason);
    throw new Error(`Letter generation failed: ${letterResult.reason}`);
  }
  if (storyResult.status === 'rejected') {
    console.error('Story generation failed:', storyResult.reason);
    throw new Error(`Story generation failed: ${storyResult.reason}`);
  }

  const letterResponse = letterResult.value;
  const storyResponse = storyResult.value;

  // Extract text from Claude's response format
  const letter = letterResponse.content[0].type === 'text'
    ? letterResponse.content[0].text
    : '';
  const story = storyResponse.content[0].type === 'text'
    ? storyResponse.content[0].text
    : '';

  if (!letter || !story) {
    throw new Error('Failed to generate content from Anthropic');
  }

  console.log(`Content generated successfully for order ${orderId}`);
  console.log(`Letter length: ${letter.length} chars`);
  console.log(`Story length: ${story.length} chars`);

  return {
    letter: letter.trim(),
    story: story.trim(),
  };
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