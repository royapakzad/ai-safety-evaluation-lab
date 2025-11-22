// services/guardrailService.ts

import { GuardrailName, GuardrailOutput } from '../types/guardrail';

/**
 * Guardrail Service for integrating with mozilla.ai's any-guardrail library
 *
 * Note: This is currently a mock implementation. To fully integrate any-guardrail:
 * 1. Set up a Python backend service with Flask/FastAPI
 * 2. Install any-guardrail: pip install any-guardrail
 * 3. Create API endpoints for guardrail evaluation
 * 4. Replace these mock functions with actual API calls
 */

interface GuardrailConfig {
  apiUrl: string; // URL to Python backend service
  timeout: number;
}

class GuardrailService {
  private config: GuardrailConfig;

  constructor(config: GuardrailConfig = { apiUrl: '/api/guardrail', timeout: 30000 }) {
    this.config = config;
  }

  /**
   * Evaluate text using the specified guardrail model
   */
  async evaluate(text: string, guardrailName: GuardrailName): Promise<GuardrailOutput> {
    try {
      // In production, this would make an API call to Python backend:
      // const response = await fetch(`${this.config.apiUrl}/evaluate`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ text, guardrail_name: guardrailName }),
      //   signal: AbortSignal.timeout(this.config.timeout)
      // });
      // return await response.json();

      return this.mockEvaluation(text, guardrailName);
    } catch (error) {
      console.error('Guardrail evaluation failed:', error);
      return {
        valid: true, // Fail open for safety
        explanation: 'Evaluation service unavailable. Content allowed by default.',
        confidence: 0.0
      };
    }
  }

  /**
   * Mock implementation that simulates guardrail behavior
   * Replace this with actual any-guardrail integration
   */
  private async mockEvaluation(text: string, guardrailName: GuardrailName): Promise<GuardrailOutput> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));

    const lowercaseText = text.toLowerCase();

    // Define harmful patterns for different guardrail models
    const harmfulPatterns = this.getHarmfulPatternsForGuardrail(guardrailName);

    let isHarmful = false;
    let matchedCategories: string[] = [];
    let confidence = 0.5;
    let explanation = '';

    // Check for harmful content
    for (const [category, patterns] of Object.entries(harmfulPatterns)) {
      if (patterns.some(pattern => lowercaseText.includes(pattern))) {
        isHarmful = true;
        matchedCategories.push(category);
      }
    }

    if (isHarmful) {
      confidence = 0.75 + Math.random() * 0.2; // 0.75-0.95
      explanation = `Content flagged for: ${matchedCategories.join(', ')}. ${this.getGuardrailSpecificExplanation(guardrailName)}`;
    } else {
      confidence = 0.85 + Math.random() * 0.1; // 0.85-0.95
      explanation = `Content appears safe according to ${this.getGuardrailDisplayName(guardrailName)} safety guidelines.`;
    }

    return {
      valid: !isHarmful,
      explanation,
      confidence,
      categories: matchedCategories,
      severity: this.calculateSeverity(matchedCategories.length, confidence)
    };
  }

  private getHarmfulPatternsForGuardrail(guardrailName: GuardrailName): Record<string, string[]> {
    const basePatterns = {
      violence: ['kill', 'murder', 'attack', 'hurt', 'harm', 'fight', 'weapon', 'gun', 'knife'],
      illegal: ['hack', 'steal', 'fraud', 'scam', 'illegal', 'criminal', 'drugs', 'bomb'],
      harassment: ['hate', 'threaten', 'bully', 'harass', 'discriminate', 'racist', 'sexist'],
      sexual: ['porn', 'sexual', 'nude', 'explicit', 'adult content'],
      self_harm: ['suicide', 'self-harm', 'cut myself', 'end my life', 'kill myself'],
      misinformation: ['conspiracy', 'fake news', 'lies', 'hoax', 'propaganda']
    };

    // Customize patterns based on guardrail model
    switch (guardrailName) {
      case 'DEEPSET':
        return {
          ...basePatterns,
          toxic_content: ['toxic', 'offensive', 'inappropriate'],
          bias: ['stereotype', 'prejudice', 'unfair']
        };

      case 'LLAMA_GUARD':
        return {
          ...basePatterns,
          regulated_activities: ['terrorism', 'extremism', 'radicalization'],
          privacy: ['personal information', 'private data', 'dox']
        };

      case 'OPENAI_MODERATION':
        return {
          ...basePatterns,
          child_safety: ['minor', 'child', 'underage'],
          spam: ['spam', 'promotional', 'advertisement']
        };

      case 'GLIDER':
        return {
          ...basePatterns,
          advanced_threats: ['sophisticated attack', 'social engineering', 'manipulation'],
          context_awareness: ['implicit threat', 'coded language', 'veiled reference']
        };

      case 'SHIELD_GEMMA':
        return {
          ...basePatterns,
          gemma_safety: ['unsafe generation', 'harmful instruction', 'dangerous request'],
          instruction_following: ['ignore instructions', 'bypass safety', 'override protection']
        };

      case 'FLOWJUDGE':
        return {
          ...basePatterns,
          flow_analysis: ['conversation manipulation', 'goal hijacking', 'context switching'],
          quality_assessment: ['low quality', 'nonsensical', 'irrelevant response']
        };

      default:
        return basePatterns;
    }
  }

  private getGuardrailDisplayName(guardrailName: GuardrailName): string {
    const names: Record<GuardrailName, string> = {
      'DEEPSET': 'Deepset Guardrail',
      'LLAMA_GUARD': 'Llama Guard',
      'OPENAI_MODERATION': 'OpenAI Moderation',
      'GLIDER': 'Glider',
      'SHIELD_GEMMA': 'Shield Gemma',
      'FLOWJUDGE': 'FlowJudge',
      'ANTHROPIC_CONSTITUTIONAL': 'Anthropic Constitutional',
      'MICROSOFT_PRESIDIO': 'Microsoft Presidio'
    };
    return names[guardrailName] || guardrailName;
  }

  private getGuardrailSpecificExplanation(guardrailName: GuardrailName): string {
    const explanations: Record<GuardrailName, string> = {
      'DEEPSET': 'Deepset\'s model detected potentially harmful language patterns.',
      'LLAMA_GUARD': 'Llama Guard identified content that violates safety guidelines.',
      'OPENAI_MODERATION': 'OpenAI\'s moderation API flagged this content as potentially harmful.',
      'GLIDER': 'Glider detected advanced safety threats or sophisticated harmful content.',
      'SHIELD_GEMMA': 'Shield Gemma identified unsafe content patterns or instruction violations.',
      'FLOWJUDGE': 'FlowJudge detected problematic conversation flow or quality issues.',
      'ANTHROPIC_CONSTITUTIONAL': 'Constitutional AI principles suggest this content should be restricted.',
      'MICROSOFT_PRESIDIO': 'Microsoft Presidio detected sensitive information or policy violations.'
    };
    return explanations[guardrailName] || 'Content flagged by safety guardrail.';
  }

  private calculateSeverity(categoryCount: number, confidence: number): 'low' | 'medium' | 'high' {
    if (categoryCount === 0) return 'low';
    if (categoryCount >= 3 || confidence > 0.9) return 'high';
    return 'medium';
  }

  /**
   * Get available guardrail models
   */
  async getAvailableGuardrails(): Promise<GuardrailName[]> {
    // In production, this would query the Python backend for available models
    return ['DEEPSET', 'LLAMA_GUARD', 'OPENAI_MODERATION', 'GLIDER', 'SHIELD_GEMMA', 'FLOWJUDGE'];
  }

  /**
   * Health check for the guardrail service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // In production, ping the Python backend
      // const response = await fetch(`${this.config.apiUrl}/health`);
      // return response.ok;
      return true; // Mock implementation always healthy
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const guardrailService = new GuardrailService();

// Export for testing or custom configuration
export { GuardrailService };
