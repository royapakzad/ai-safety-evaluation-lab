export type GuardrailName = 'DEEPSET' | 'LLAMA_GUARD' | 'NVIDIA_NEMOLLM' | 'OPENAI_MODERATION';

export interface GuardrailRequest {
  text: string;
  guardrail?: GuardrailName;
}

export interface GuardrailResponse {
  valid: boolean;
  explanation?: string | null;
  guardrail_used: GuardrailName;
  score?: number | null;
  confidence?: number | null;
  categories?: string[] | null;
}

export interface GuardrailError {
  error: string;
  available?: GuardrailName[];
  traceback?: string;
}

export interface GuardrailHealthResponse {
  available_guardrails: GuardrailName[];
  status: string;
}

export interface GuardrailEvaluationResult {
  id: string;
  timestamp: Date;
  userId: string;
  prompt: string;
  llmModel: string;
  guardrailModel: GuardrailName;
  llmResponse: string | null;
  guardrailResult: GuardrailResponse | null;
  generationTime: number | null;
  isBlocked: boolean;
}