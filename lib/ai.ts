import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { processPromptTemplate, buildPromptContext } from '@/lib/prompt-template';

// Lazy initialization of AI clients
let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

// Determine which AI provider to use
function getAIProvider(): 'anthropic' | 'openai' {
  if (process.env.ANTHROPIC_API_KEY) {
    return 'anthropic';
  }
  if (process.env.OPENAI_API_KEY) {
    return 'openai';
  }
  throw new Error('No AI API key configured. Please set either ANTHROPIC_API_KEY or OPENAI_API_KEY');
}

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

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    console.log('Initializing OpenAI client (fallback mode)');
    openaiClient = new OpenAI({
      apiKey: apiKey,
      timeout: 30000, // 30 second timeout
      maxRetries: 2, // Retry up to 2 times on network errors
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
 * Generate personalized letter and story content using Anthropic's Claude
 */
async function generateWithProvider(
  provider: 'anthropic' | 'openai',
  orderId: string,
  recipientName: string,
  recipientAge: number | null,
  processedLetterPrompt: string,
  processedStoryPrompt: string
): Promise<GeneratedContent> {
  console.log(`Attempting generation with provider: ${provider}`);
  const startTime = Date.now();

  let letterResult: PromiseSettledResult<any>;
  let storyResult: PromiseSettledResult<any>;

  if (provider === 'anthropic') {
    // Anthropic models for creative writing:
    // - claude-3-5-sonnet-20241022: Best for creative writing (default)
    // - claude-3-5-haiku-20241022: Faster, cheaper, still good
    // - claude-3-opus-20240229: Previous best, very capable
    const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
    console.log(`Using Anthropic model: ${model}`);

    const client = getAnthropicClient();
    console.log('Anthropic client obtained, starting API calls...');

    // Create the API call promises with additional logging
    const letterPromise = client.messages.create({
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
    }).then(res => {
      console.log('Letter generation completed');
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
          content: `Generate a captivating, personalized story featuring ${recipientName} as the main character. Make it adventurous, magical, and age-appropriate for a ${recipientAge || 'young'} year old. Include vivid descriptions and engaging plot that will capture their imagination.`,
        },
      ],
    }).then(res => {
      console.log('Story generation completed');
      return res;
    }).catch(err => {
      console.error('Story generation failed:', err);
      throw err;
    });

    console.log('Waiting for both generations to complete...');
    // Generate letter and story in parallel with individual error handling
    [letterResult, storyResult] = await Promise.allSettled([letterPromise, storyPromise]);
  } else {
    // Fallback to OpenAI - use best model for creative writing
    // Models ranked by creative writing ability:
    // - gpt-4o: Best overall, newest model (May 2024)
    // - gpt-4-turbo: Very good, stable
    // - gpt-4-turbo-preview: Good but older
    // - gpt-4: Original, still excellent
    const model = process.env.OPENAI_MODEL || 'gpt-4o';
    console.log(`Using OpenAI model: ${model}`);

    // Generate letter and story in parallel using OpenAI
    [letterResult, storyResult] = await Promise.allSettled([
      getOpenAIClient().chat.completions.create({
        model: model,
        max_tokens: 1000,
        temperature: 0.95, // Slightly higher for more creativity
        messages: [
          {
            role: 'system',
            content: processedLetterPrompt,
          },
          {
            role: 'user',
            content: `Generate a personalized, heartwarming letter for ${recipientName}. Make it magical, engaging, and age-appropriate for a ${recipientAge || 'young'} year old. Include specific details that make it feel truly personal.`,
          },
        ],
      }),
      getOpenAIClient().chat.completions.create({
        model: model,
        max_tokens: 1500,
        temperature: 0.95, // Slightly higher for more creativity
        messages: [
          {
            role: 'system',
            content: processedStoryPrompt,
          },
          {
            role: 'user',
            content: `Generate a captivating, personalized story featuring ${recipientName} as the main character. Make it adventurous, magical, and age-appropriate for a ${recipientAge || 'young'} year old. Include vivid descriptions and engaging plot that will capture their imagination.`,
          },
        ],
      }),
    ]);
  }

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

  let letter: string = '';
  let story: string = '';

  if (provider === 'anthropic') {
    // Extract text from Claude's response format
    letter = letterResponse.content[0].type === 'text'
      ? letterResponse.content[0].text
      : '';
    story = storyResponse.content[0].type === 'text'
      ? storyResponse.content[0].text
      : '';
  } else {
    // Extract text from OpenAI's response format
    letter = letterResponse.choices[0]?.message?.content || '';
    story = storyResponse.choices[0]?.message?.content || '';
  }

  if (!letter || !story) {
    throw new Error(`Failed to generate content from ${provider}`);
  }

  console.log(`Content generated successfully for order ${orderId}`);
  console.log(`Letter length: ${letter.length} chars`);
  console.log(`Story length: ${story.length} chars`);
  console.log(`Provider used: ${provider}`);

  return {
    letter: letter.trim(),
    story: story.trim(),
  };
}

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

  // Try Anthropic first if available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      console.log('Attempting generation with Anthropic...');
      return await generateWithProvider(
        'anthropic',
        orderId,
        recipientName,
        recipientAge,
        processedLetterPrompt,
        processedStoryPrompt
      );
    } catch (anthropicError: any) {
      console.error('Anthropic generation failed, checking fallback options...', anthropicError);

      // Check if we should fallback to OpenAI
      if (process.env.OPENAI_API_KEY) {
        console.log('Falling back to OpenAI due to Anthropic error...');
        try {
          return await generateWithProvider(
            'openai',
            orderId,
            recipientName,
            recipientAge,
            processedLetterPrompt,
            processedStoryPrompt
          );
        } catch (openaiError) {
          console.error('OpenAI fallback also failed:', openaiError);
          // Throw the original Anthropic error since that was the primary provider
          throw anthropicError;
        }
      } else {
        // No OpenAI fallback available, throw the Anthropic error
        throw anthropicError;
      }
    }
  }

  // No Anthropic key, try OpenAI
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log('Using OpenAI (no Anthropic key available)...');
      return await generateWithProvider(
        'openai',
        orderId,
        recipientName,
        recipientAge,
        processedLetterPrompt,
        processedStoryPrompt
      );
    } catch (error: any) {
      console.error('OpenAI generation failed:', error);
      throw error;
    }
  }

  // No API keys available
  throw new Error('No AI API key configured. Please set either ANTHROPIC_API_KEY or OPENAI_API_KEY');
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