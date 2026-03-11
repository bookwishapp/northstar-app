import Handlebars from 'handlebars';

export interface PersonalizationField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number';
  placeholder?: string;
  required: boolean;
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
 * Register custom Handlebars helpers for all personalization fields
 */
export function registerPersonalizationHelpers(recipientDetails: Record<string, any> = {}): void {
  Object.keys(recipientDetails).forEach((fieldName) => {
    const value = recipientDetails[fieldName];
    if (value !== undefined && value !== null && value !== '') {
      Handlebars.registerHelper(fieldName, () => value);
    }
  });
}

/**
 * Generate field configuration for a variable name
 */
export function generateFieldConfig(variableName: string): PersonalizationField {
  const label = variableName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();

  let type: PersonalizationField['type'] = 'text';
  if (variableName.toLowerCase().includes('message') ||
      variableName.toLowerCase().includes('story') ||
      variableName.toLowerCase().includes('description') ||
      variableName.toLowerCase().includes('things')) {
    type = 'textarea';
  } else if (variableName.toLowerCase().includes('age') ||
             variableName.toLowerCase().includes('number') ||
             variableName.toLowerCase().includes('count')) {
    type = 'number';
  }

  return {
    name: variableName,
    label,
    type,
    placeholder: `Enter ${label.toLowerCase()}`,
    required: true
  };
}