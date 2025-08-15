// constants/models.ts

import { ModelDefinition } from '../types';

/**
 * A list of all LLM models available for selection in the application.
 * This is the single source of truth for which models are supported.
 */
export const AVAILABLE_MODELS: ModelDefinition[] = [
  { id: "openai/gpt-4o", name: "OpenAI GPT-4o", provider: "openai" },
  { id: "gemini/gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "gemini" },
  { id: "mistral/mistral-small-latest", name: "Mistral Small", provider: "mistral" },
];