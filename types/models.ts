// types/models.ts

import { ProviderType } from './common';

/**
 * A union of all specific, selectable model IDs.
 * The format is 'provider/model-name'.
 */
export type LLMModelType = 
  | 'gemini/gemini-2.5-flash'
  | 'openai/gpt-3.5-turbo'
  | 'openai/gpt-4o' // Added to support 'o3' comparison
  | 'mistral/mistral-small-latest';

/**
 * Defines the structure for a model, including its display name and provider.
 */
export interface ModelDefinition {
  id: LLMModelType;
  name: string;
  provider: ProviderType;
}
