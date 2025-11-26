import { GuardrailRequest, GuardrailResponse, GuardrailError, GuardrailHealthResponse, GuardrailName } from '../types/guardrail';

class GuardrailService {
  private readonly baseUrl: string;

  constructor() {
    // Use the current origin in production, localhost for development
    this.baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000';
  }

  async healthCheck(): Promise<GuardrailHealthResponse> {
    const response = await fetch(`${this.baseUrl}/api/guardrail`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return response.json();
  }

  async validate(text: string, guardrail: GuardrailName = 'DEEPSET'): Promise<GuardrailResponse> {
    if (!text.trim()) {
      throw new Error('Text cannot be empty');
    }

    const request: GuardrailRequest = {
      text: text.trim(),
      guardrail,
    };

    const response = await fetch(`${this.baseUrl}/api/guardrail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as GuardrailError;
      throw new Error(error.error || `Guardrail API error: ${response.status}`);
    }

    return data as GuardrailResponse;
  }

  async getAvailableGuardrails(): Promise<GuardrailName[]> {
    try {
      const health = await this.healthCheck();
      return health.available_guardrails;
    } catch (error) {
      console.error('Failed to get available guardrails:', error);
      return ['DEEPSET']; // Fallback to default
    }
  }
}

export const guardrailService = new GuardrailService();