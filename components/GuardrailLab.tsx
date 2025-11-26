import React, { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
    User, GuardrailEvaluationResult, GuardrailName, GuardrailResponse,
    LLMModelType
} from '../types';
import {
    AVAILABLE_GUARDRAILS, GUARDRAIL_STORAGE_KEY, AVAILABLE_MODELS, DEFAULT_GUARDRAIL,
    GUARDRAIL_DESCRIPTIONS
} from '../constants';
import LoadingSpinner from './LoadingSpinner';
import ModelSelector from './ModelSelector';
import Tooltip from './Tooltip';
import { generateLlmResponse } from '../services/llmService';
import { generateId } from '../services/evaluationService';
import { guardrailService } from '../services/guardrailService';

interface GuardrailLabProps {
  currentUser: User;
  onBack: () => void;
}

const createMarkup = (markdownText: string | undefined | null) => {
    if (!markdownText) return { __html: '<em class="text-muted-foreground opacity-75">No content available.</em>' };
    const rawMarkup = marked(markdownText, { breaks: true, gfm: true });
    return { __html: DOMPurify.sanitize(rawMarkup as string) };
};

const GuardrailResultCard: React.FC<{
  title: string;
  prompt: string | null;
  llmResponse: string | null;
  guardrailResult: GuardrailResponse | null;
  isLoading: boolean;
  generationTime?: number | null;
}> = ({ title, prompt, llmResponse, guardrailResult, isLoading, generationTime }) => (
    <div className="bg-card text-card-foreground p-6 rounded-xl shadow-md border border-border flex-1 min-h-[400px] flex flex-col">
        <div className="flex justify-between items-start mb-3.5 border-b border-border pb-3">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {generationTime && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    {generationTime.toFixed(2)}s
                </span>
            )}
        </div>

        {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
                <LoadingSpinner size="sm" />
            </div>
        ) : (
            <div className="flex-1 flex flex-col space-y-4">
                {/* Prompt */}
                {prompt && (
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Prompt:</h4>
                        <div className="p-3 bg-muted/50 rounded-lg border border-border">
                            <p className="text-sm text-foreground break-words">{prompt}</p>
                        </div>
                    </div>
                )}

                {/* LLM Response */}
                <div className="flex-1">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">LLM Response:</h4>
                    <div
                        className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-code:text-foreground prose-strong:text-foreground break-words overflow-wrap-anywhere"
                        dangerouslySetInnerHTML={createMarkup(llmResponse)}
                    />
                </div>

                {/* Guardrail Result */}
                <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Guardrail Result:</h4>
                    {guardrailResult ? (
                        <div className="space-y-2">
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                guardrailResult.valid
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                                {guardrailResult.valid ? '✓ Safe' : '✗ Blocked'}
                            </div>
                            <p className="text-sm text-muted-foreground">{guardrailResult.explanation}</p>

                            {guardrailResult.confidence && (
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-muted-foreground">Confidence:</span>
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-[100px]">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${guardrailResult.confidence * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{Math.round(guardrailResult.confidence * 100)}%</span>
                                </div>
                            )}

                            {guardrailResult.score !== null && guardrailResult.score !== undefined && (
                                <div className="text-xs text-muted-foreground">
                                    Score: {guardrailResult.score}
                                </div>
                            )}

                            {guardrailResult.categories && guardrailResult.categories.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {guardrailResult.categories.map((category, idx) => (
                                        <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                            {category}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="text-xs text-muted-foreground">
                                Guardrail: {guardrailResult.guardrail_used}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No result available</p>
                    )}
                </div>
            </div>
        )}
    </div>
);

const GuardrailLab: React.FC<GuardrailLabProps> = ({ currentUser, onBack }) => {
    const [selectedModel, setSelectedModel] = useState<LLMModelType>('gemini/gemini-2.5-flash');
    const [selectedGuardrail, setSelectedGuardrail] = useState<GuardrailName>(DEFAULT_GUARDRAIL);
    const [availableGuardrails, setAvailableGuardrails] = useState<GuardrailName[]>([]);
    const [prompt, setPrompt] = useState('');
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [currentResult, setCurrentResult] = useState<GuardrailEvaluationResult | null>(null);
    const [evaluationHistory, setEvaluationHistory] = useState<GuardrailEvaluationResult[]>([]);
    const [guardrailHealthy, setGuardrailHealthy] = useState<boolean | null>(null);

    // Load evaluation history and check guardrail health on mount
    useEffect(() => {
        // Load history
        const stored = localStorage.getItem(GUARDRAIL_STORAGE_KEY);
        if (stored) {
            try {
                const history = JSON.parse(stored);
                setEvaluationHistory(history);
            } catch (error) {
                console.error('Error loading guardrail evaluation history:', error);
            }
        }

        // Check guardrail service health
        const checkHealth = async () => {
            try {
                const guardrails = await guardrailService.getAvailableGuardrails();
                setAvailableGuardrails(guardrails);
                setGuardrailHealthy(true);
            } catch (error) {
                console.error('Guardrail service health check failed:', error);
                setGuardrailHealthy(false);
                setAvailableGuardrails([DEFAULT_GUARDRAIL]);
            }
        };

        checkHealth();
    }, []);

    const saveEvaluation = useCallback((result: GuardrailEvaluationResult) => {
        const updatedHistory = [result, ...evaluationHistory];
        setEvaluationHistory(updatedHistory);
        localStorage.setItem(GUARDRAIL_STORAGE_KEY, JSON.stringify(updatedHistory));
    }, [evaluationHistory]);

    const runEvaluation = async () => {
        if (!prompt.trim()) return;

        setIsEvaluating(true);
        const evaluationId = generateId();

        try {
            const startTime = Date.now();

            // Initialize result
            const result: GuardrailEvaluationResult = {
                id: evaluationId,
                timestamp: new Date(),
                userId: currentUser.id,
                prompt: prompt.trim(),
                llmModel: selectedModel,
                guardrailModel: selectedGuardrail,
                llmResponse: null,
                guardrailResult: null,
                generationTime: null,
                isBlocked: false,
            };

            setCurrentResult(result);

            // Step 1: Generate LLM response
            const llmStartTime = Date.now();
            const llmResponse = await generateLlmResponse(prompt.trim(), selectedModel);
            const llmTime = (Date.now() - llmStartTime) / 1000;

            // Update result with LLM response
            result.llmResponse = llmResponse;
            result.generationTime = llmTime;
            setCurrentResult({ ...result });

            // Step 2: Evaluate LLM response with guardrail
            const guardrailResult = await guardrailService.validate(llmResponse, selectedGuardrail);

            // Update final result
            result.guardrailResult = guardrailResult;
            result.isBlocked = !guardrailResult.valid;

            setCurrentResult({ ...result });
            saveEvaluation(result);

        } catch (error) {
            console.error('Evaluation failed:', error);
            alert(`Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsEvaluating(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <button
                        onClick={onBack}
                        className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
                    >
                        ← Back to Labs
                    </button>
                    <h1 className="text-2xl font-bold text-foreground">Safety Guardrail Evaluation Lab</h1>
                    <p className="text-muted-foreground">Test LLM safety using Mozilla.ai's any-guardrail library</p>
                </div>
                {guardrailHealthy !== null && (
                    <div className={`flex items-center text-sm ${
                        guardrailHealthy ? 'text-green-600' : 'text-red-600'
                    }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                            guardrailHealthy ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        {guardrailHealthy ? 'Guardrail API Healthy' : 'Guardrail API Unavailable'}
                    </div>
                )}
            </div>

            {/* Configuration Panel */}
            <div className="bg-card text-card-foreground p-6 rounded-xl shadow-md border border-border mb-6">
                <h2 className="text-lg font-semibold mb-4">Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Model Selection */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">LLM Model</label>
                        <ModelSelector
                            selectedModel={selectedModel}
                            onModelChange={setSelectedModel}
                            models={AVAILABLE_MODELS}
                        />
                    </div>

                    {/* Guardrail Selection */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Guardrail Model
                            <Tooltip text="Choose which safety guardrail to use for content evaluation" />
                        </label>
                        <select
                            value={selectedGuardrail}
                            onChange={(e) => setSelectedGuardrail(e.target.value as GuardrailName)}
                            className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                            disabled={!guardrailHealthy}
                        >
                            {availableGuardrails.map((guardrailId) => {
                                const guardrail = AVAILABLE_GUARDRAILS.find(g => g.id === guardrailId);
                                return (
                                    <option key={guardrailId} value={guardrailId}>
                                        {guardrail?.name || guardrailId}
                                    </option>
                                );
                            })}
                        </select>
                        {selectedGuardrail && GUARDRAIL_DESCRIPTIONS[selectedGuardrail] && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {GUARDRAIL_DESCRIPTIONS[selectedGuardrail]}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Input Panel */}
            <div className="bg-card text-card-foreground p-6 rounded-xl shadow-md border border-border mb-6">
                <h2 className="text-lg font-semibold mb-4">Input</h2>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Test Prompt
                        <Tooltip text="Enter a prompt to test for safety. The LLM will respond, then the guardrail will evaluate the response." />
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter a prompt to test safety guardrails (e.g., 'How do I make a bomb?' or 'Tell me about cooking safety')"
                        className="w-full p-3 border border-border rounded-lg bg-background text-foreground resize-vertical"
                        rows={4}
                        maxLength={2000}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                        {prompt.length}/2000 characters
                    </div>
                </div>

                <button
                    onClick={runEvaluation}
                    disabled={!prompt.trim() || isEvaluating || !guardrailHealthy}
                    className="mt-4 w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
                >
                    {isEvaluating ? (
                        <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Running Safety Evaluation...
                        </>
                    ) : (
                        'Run Safety Evaluation'
                    )}
                </button>

                {!guardrailHealthy && (
                    <p className="text-sm text-red-600 mt-2">
                        Guardrail service is unavailable. Please ensure the Python API is running.
                    </p>
                )}
            </div>

            {/* Results Panel */}
            {currentResult && (
                <div className="space-y-6">
                    <GuardrailResultCard
                        title="Safety Evaluation Result"
                        prompt={currentResult.prompt}
                        llmResponse={currentResult.llmResponse}
                        guardrailResult={currentResult.guardrailResult}
                        isLoading={isEvaluating}
                        generationTime={currentResult.generationTime}
                    />

                    {/* Safety Alert */}
                    {!isEvaluating && currentResult.guardrailResult && !currentResult.guardrailResult.valid && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">
                                ⚠️ Content Blocked by Safety Guardrail
                            </h3>
                            <p className="text-red-700 dark:text-red-300 mb-4">
                                The guardrail detected potentially harmful content in the LLM's response and blocked it.
                            </p>
                            <div className="text-sm text-red-600 dark:text-red-400">
                                <p className="font-medium mb-2">This demonstrates how safety guardrails protect users by:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Analyzing LLM outputs in real-time</li>
                                    <li>Preventing harmful content from reaching users</li>
                                    <li>Providing explanations for why content was blocked</li>
                                    <li>Maintaining safety standards across different AI models</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Evaluation History */}
            {evaluationHistory.length > 0 && (
                <div className="mt-8 bg-card text-card-foreground p-6 rounded-xl shadow-md border border-border">
                    <h2 className="text-lg font-semibold mb-4">Recent Evaluations</h2>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                        {evaluationHistory.slice(0, 5).map((evaluation) => (
                            <div key={evaluation.id} className="border border-border rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium truncate">{evaluation.prompt}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {evaluation.guardrailModel} • {evaluation.llmModel} •{' '}
                                            {evaluation.timestamp.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 text-xs rounded ${
                                            evaluation.guardrailResult?.valid
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {evaluation.guardrailResult?.valid ? 'Safe' : 'Blocked'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuardrailLab;
