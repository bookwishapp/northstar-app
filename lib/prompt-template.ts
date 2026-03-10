import Handlebars from 'handlebars';

/**
 * Process a Handlebars template prompt with recipient data
 * Replaces {{variables}} and handles {{#if}} conditionals
 */
export function processPromptTemplate(
  promptTemplate: string,
  recipientData: Record<string, any>
): string {
  try {
    // Compile the Handlebars template
    const template = Handlebars.compile(promptTemplate);

    // Process the template with the data
    const processedPrompt = template(recipientData);

    return processedPrompt;
  } catch (error) {
    console.error('Failed to process Handlebars template:', error);
    // If template processing fails, return the original template
    // This ensures the system doesn't break with legacy prompts
    return promptTemplate;
  }
}

/**
 * Build a complete context object from order/recipient data
 * This standardizes the data structure for Handlebars templates
 */
export function buildPromptContext(
  recipientName: string,
  recipientAge?: number | null,
  recipientDetails?: any
): Record<string, any> {
  const context: Record<string, any> = {
    recipientName: recipientName || 'Friend',
    recipientAge: recipientAge || '',
  };

  // Add all recipient details to the context
  if (recipientDetails && typeof recipientDetails === 'object') {
    Object.entries(recipientDetails).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        context[key] = value;
      }
    });
  }

  // Add commonly used derived fields
  if (recipientAge) {
    // Determine age group for more personalized content
    if (recipientAge <= 3) {
      context.ageGroup = 'toddler';
    } else if (recipientAge <= 6) {
      context.ageGroup = 'preschooler';
    } else if (recipientAge <= 9) {
      context.ageGroup = 'school-age';
    } else if (recipientAge <= 12) {
      context.ageGroup = 'preteen';
    } else {
      context.ageGroup = 'teen';
    }
  }

  // Set default pronouns if not provided
  if (!context.recipientPronouns) {
    context.recipientPronouns = 'they/them';
  }

  return context;
}

/**
 * Common holiday-specific fields that might be in templates
 * This helps guide what fields to collect in forms
 */
export const COMMON_TEMPLATE_FIELDS = {
  christmas: [
    'recipientName',
    'recipientAge',
    'recipientPronouns',
    'recipientTown',
    'recipientRelationship',
    'goodDeeds',
    'encouragementTopic',
    'favoriteThings',
    'elfNotes',
    'specialAchievements',
    'christmasWishes',
  ],
  easter: [
    'recipientName',
    'recipientAge',
    'recipientPronouns',
    'recipientTown',
    'recipientRelationship',
    'goodDeeds',
    'encouragementTopic',
    'favoriteThings',
    'elfNotes', // Can be repurposed as "bunny notes"
    'springActivities',
    'favoriteColors',
  ],
  birthday: [
    'recipientName',
    'recipientAge',
    'recipientPronouns',
    'recipientTown',
    'birthdayDate',
    'favoriteThings',
    'birthdayWishes',
    'specialAchievements',
    'upcomingYear',
  ],
  valentines: [
    'recipientName',
    'recipientAge',
    'recipientPronouns',
    'recipientTown',
    'recipientRelationship',
    'favoriteThings',
    'kindnessExamples',
    'friendshipQualities',
  ],
  halloween: [
    'recipientName',
    'recipientAge',
    'recipientPronouns',
    'recipientTown',
    'favoriteThings',
    'costumeIdeas',
    'notTooScary', // boolean flag for younger kids
    'spookyInterests',
  ],
};

/**
 * Extract Handlebars variables from a template
 * Useful for determining what fields need to be collected
 */
export function extractTemplateVariables(template: string): string[] {
  const variableRegex = /\{\{#?(?:if\s+)?([a-zA-Z0-9_]+)\}\}/g;
  const variables = new Set<string>();

  let match;
  while ((match = variableRegex.exec(template)) !== null) {
    if (match[1] && match[1] !== 'if') {
      variables.add(match[1]);
    }
  }

  return Array.from(variables);
}