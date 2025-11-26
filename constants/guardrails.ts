import { GuardrailName } from '../types/guardrail';

export const AVAILABLE_GUARDRAILS: Array<{
  id: GuardrailName;
  name: string;
  description: string;
  available: boolean;
}> = [
  {
    id: 'DEEPSET',
    name: 'Deepset SafetyChecker',
    description: 'Text classification model for detecting harmful content',
    available: true,
  },
  {
    id: 'LLAMA_GUARD',
    name: 'Llama Guard',
    description: 'Meta\'s safety classifier for chat interactions',
    available: true,
  },
  {
    id: 'NVIDIA_NEMOLLM',
    name: 'NVIDIA NeMo LLM',
    description: 'NVIDIA\'s safety guardrail system',
    available: true,
  },
  {
    id: 'OPENAI_MODERATION',
    name: 'OpenAI Moderation',
    description: 'OpenAI\'s content moderation endpoint',
    available: true,
  },
];

export const DEFAULT_GUARDRAIL: GuardrailName = 'DEEPSET';

export const GUARDRAIL_STORAGE_KEY = 'guardrail_evaluation_history';

export const GUARDRAIL_DESCRIPTIONS = {
  DEEPSET: 'Uses Deepset\'s pre-trained safety classification models to detect harmful content across multiple categories.',
  LLAMA_GUARD: 'Meta\'s Llama Guard model specifically designed for conversational safety in chat applications.',
  NVIDIA_NEMOLLM: 'NVIDIA\'s enterprise-grade safety guardrail system with advanced threat detection.',
  OPENAI_MODERATION: 'OpenAI\'s Moderation API for detecting potentially harmful content across various categories.',
} as const;