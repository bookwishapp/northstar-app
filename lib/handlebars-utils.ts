import Handlebars from 'handlebars';

export interface PersonalizationField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select type
}

/**
 * Extract all Handlebars variables from a template string
 * Includes both simple {{variable}} and conditionals {{#if variable}}
 */
export function extractHandlebarsVariables(template: string): string[] {
  const variables = new Set<string>();

  // Match simple variables {{variable}}
  const simpleVarRegex = /\{\{(?!#|\/|>|!)([^}]+)\}\}/g;
  let match;

  while ((match = simpleVarRegex.exec(template)) !== null) {
    const varName = match[1].trim();
    // Remove any Handlebars helpers or filters
    const cleanVarName = varName.split(' ')[0].split('|')[0];
    if (cleanVarName && !cleanVarName.includes('(')) {
      variables.add(cleanVarName);
    }
  }

  // Match conditional variables {{#if variable}} and {{#unless variable}}
  const conditionalRegex = /\{\{#(?:if|unless|each|with)\s+([^}]+)\}\}/g;

  while ((match = conditionalRegex.exec(template)) !== null) {
    const varName = match[1].trim();
    const cleanVarName = varName.split(' ')[0].split('|')[0];
    if (cleanVarName && !cleanVarName.includes('(')) {
      variables.add(cleanVarName);
    }
  }

  return Array.from(variables);
}

/**
 * Extract variables from all prompts in a template
 */
export function extractTemplateVariables(template: {
  letterPrompt?: string | null;
  storyPrompt?: string | null;
}): string[] {
  const allVariables = new Set<string>();

  if (template.letterPrompt) {
    extractHandlebarsVariables(template.letterPrompt).forEach(v => allVariables.add(v));
  }

  if (template.storyPrompt) {
    extractHandlebarsVariables(template.storyPrompt).forEach(v => allVariables.add(v));
  }

  // Always include these core fields that are collected separately
  const coreFields = ['recipientName', 'recipientAge', 'customerName'];

  // Filter out core fields as they're handled by the main form
  return Array.from(allVariables).filter(v => !coreFields.includes(v));
}

/**
 * Default field configurations for common variable names
 */
export const defaultFieldConfigs: Record<string, Partial<PersonalizationField>> = {
  // Child-related
  childName: {
    label: "Child's Name",
    type: 'text',
    placeholder: "Enter the child's name",
    required: true
  },
  childAge: {
    label: "Child's Age",
    type: 'number',
    placeholder: "How old are they?",
    required: true
  },

  // Activities and interests
  favoriteActivities: {
    label: "Favorite Activities",
    type: 'textarea',
    placeholder: "What do they love to do? (sports, hobbies, games...)",
    required: true
  },
  favoriteActivity: {
    label: "Favorite Activity",
    type: 'text',
    placeholder: "Their favorite thing to do",
    required: true
  },
  currentInterest: {
    label: "Current Interest",
    type: 'text',
    placeholder: "What are they really into right now?",
    required: true
  },
  favoriteColor: {
    label: "Favorite Color",
    type: 'text',
    placeholder: "Their favorite color",
    required: false
  },

  // Achievements and qualities
  accomplishment: {
    label: "Recent Accomplishment",
    type: 'textarea',
    placeholder: "Something great they've done recently",
    required: true
  },
  recentKindness: {
    label: "Recent Act of Kindness",
    type: 'textarea',
    placeholder: "How have they shown kindness?",
    required: true
  },
  specialQualities: {
    label: "Special Qualities",
    type: 'textarea',
    placeholder: "What makes them special?",
    required: false
  },

  // Family and friends
  siblings: {
    label: "Siblings",
    type: 'text',
    placeholder: "Brother Jack, sister Emma... (optional)",
    required: false
  },
  pets: {
    label: "Pets",
    type: 'text',
    placeholder: "Dog named Max, cat named Whiskers... (optional)",
    required: false
  },
  bestFriend: {
    label: "Best Friend",
    type: 'text',
    placeholder: "Their best friend's name",
    required: false
  },

  // Holiday-specific
  costume: {
    label: "Halloween Costume",
    type: 'text',
    placeholder: "What are they dressing up as?",
    required: true
  },
  favoriteCandy: {
    label: "Favorite Candy",
    type: 'text',
    placeholder: "Their favorite Halloween candy",
    required: true
  },
  birthdayWish: {
    label: "Birthday Wish",
    type: 'text',
    placeholder: "What's their birthday wish?",
    required: false
  },
  behavior: {
    label: "Behavior This Year",
    type: 'select',
    options: ['Very good', 'Mostly good', 'Trying their best'],
    required: true
  },

  // Generic fallback
  specialMessage: {
    label: "Special Message",
    type: 'textarea',
    placeholder: "Any special message to include?",
    required: false
  }
};

/**
 * Generate field configuration for a variable name
 */
export function generateFieldConfig(variableName: string): PersonalizationField {
  // Check if we have a default config
  const defaultConfig = defaultFieldConfigs[variableName];
  if (defaultConfig) {
    return {
      key: variableName,
      type: 'text',
      required: true,
      ...defaultConfig
    } as PersonalizationField;
  }

  // Generate a sensible default based on the variable name
  const label = variableName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim();

  // Determine type based on variable name patterns
  let type: PersonalizationField['type'] = 'text';
  if (variableName.toLowerCase().includes('message') ||
      variableName.toLowerCase().includes('story') ||
      variableName.toLowerCase().includes('description')) {
    type = 'textarea';
  } else if (variableName.toLowerCase().includes('age') ||
             variableName.toLowerCase().includes('number') ||
             variableName.toLowerCase().includes('count')) {
    type = 'number';
  }

  return {
    key: variableName,
    label,
    type,
    placeholder: `Enter ${label.toLowerCase()}`,
    required: true
  };
}

/**
 * Generate field configurations for all variables in a template
 */
export function generateTemplateFields(template: {
  letterPrompt?: string | null;
  storyPrompt?: string | null;
  personalizationFields?: any;
}): PersonalizationField[] {
  // Extract all variables from prompts
  const variables = extractTemplateVariables(template);

  // If template has existing field configs, use those
  const existingFields = template.personalizationFields as PersonalizationField[] || [];
  const existingKeys = new Set(existingFields.map(f => f.key));

  // Generate configs for new variables
  const fields: PersonalizationField[] = [...existingFields];

  for (const variable of variables) {
    if (!existingKeys.has(variable)) {
      fields.push(generateFieldConfig(variable));
    }
  }

  return fields;
}