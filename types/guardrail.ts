// types/guardrail.ts

export type GuardrailName =
  | 'DEEPSET'
  | 'LLAMA_GUARD'
  | 'OPENAI_MODERATION'
  | 'ANTHROPIC_CONSTITUTIONAL'
  | 'MICROSOFT_PRESIDIO'
  | 'GLIDER'
  | 'SHIELD_GEMMA'
  | 'FLOWJUDGE';

export interface GuardrailOutput {
  valid: boolean;
  explanation: string;
  confidence?: number;
  categories?: string[];
  severity?: 'low' | 'medium' | 'high';
}

export interface GuardrailModel {
  id: GuardrailName;
  name: string;
  description: string;
  provider: string;
  available: boolean;
}

export interface GuardrailEvaluationRequest {
  prompt: string;
  targetLanguage: string;
  guardrailModel: GuardrailName;
  llmModel: string;
}

export interface GuardrailEvaluationResult {
  id: string;
  timestamp: Date;
  userId: string;
  prompt: string;
  englishPrompt: string;
  translatedPrompt: string | null;
  targetLanguage: string;
  guardrailModel: GuardrailName;
  llmModel: string;

  // English evaluation
  englishLlmResponse: string | null;
  englishGuardrailResult: GuardrailOutput | null;
  englishGenerationTime: number | null;

  // Translated evaluation
  translatedLlmResponse: string | null;
  translatedGuardrailResult: GuardrailOutput | null;
  translatedGenerationTime: number | null;

  // Analysis
  safetyDisparity: boolean;
  disparityAnalysis: string | null;
  notes?: string;
}

export interface GuardrailBatchUpload {
  scenarios: GuardrailScenario[];
}

export interface GuardrailScenario {
  prompt: string;
  expectedOutcome?: 'block' | 'allow' | 'unknown';
  category?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  notes?: string;
}
