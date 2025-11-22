import React, { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
    User, GuardrailEvaluationResult, GuardrailName, GuardrailOutput,
    GuardrailScenario, LLMModelType
} from '../types';
import {
    AVAILABLE_GUARDRAILS, GUARDRAIL_STORAGE_KEY, GUARDRAIL_SYSTEM_INSTRUCTION,
    SAFETY_DISPARITY_CRITERIA, GUARDRAIL_RISK_LEVELS, AVAILABLE_MODELS, AVAILABLE_NATIVE_LANGUAGES
} from '../constants';
import LoadingSpinner from './LoadingSpinner';
import ModelSelector from './ModelSelector';
import Tooltip from './Tooltip';
import { generateLlmResponse, translateText } from '../services/llmService';
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
  llmResponse: string | null;
  guardrailResult: GuardrailOutput | null;
  isLoading: boolean;
  generationTime?: number | null;
}> = ({ title, llmResponse, guardrailResult, isLoading, generationTime }) => (
    <div className="bg-card text-card-foreground p-6 rounded-xl shadow-md border border-border flex-1 min-h-[300px] flex flex-col">
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
                                {guardrailResult.valid ? '✓ Allowed' : '✗ Blocked'}
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
                            {guardrailResult.categories && guardrailResult.categories.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {guardrailResult.categories.map((category, idx) => (
                                        <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                            {category}
                                        </span>
                                    ))}
                                </div>
                            )}
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
    const [selectedGuardrail, setSelectedGuardrail] = useState<GuardrailName>('DEEPSET');
    const [selectedLanguage, setSelectedLanguage] = useState('spanish');
    const [prompt, setPrompt] = useState('');
    const [csvScenarios, setCsvScenarios] = useState<GuardrailScenario[]>([]);
    const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [currentResult, setCurrentResult] = useState<GuardrailEvaluationResult | null>(null);
    const [evaluationHistory, setEvaluationHistory] = useState<GuardrailEvaluationResult[]>([]);

    // Load evaluation history on mount
    useEffect(() => {
        const stored = localStorage.getItem(GUARDRAIL_STORAGE_KEY);
        if (stored) {
            try {
                const history = JSON.parse(stored);
                setEvaluationHistory(history);
            } catch (error) {
                console.error('Error loading guardrail evaluation history:', error);
            }
        }
    }, []);

    const saveEvaluation = useCallback((result: GuardrailEvaluationResult) => {
        const updatedHistory = [result, ...evaluationHistory];
        setEvaluationHistory(updatedHistory);
        localStorage.setItem(GUARDRAIL_STORAGE_KEY, JSON.stringify(updatedHistory));
    }, [evaluationHistory]);

    const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const lines = text.split('\n').slice(1); // Skip header
            const scenarios: GuardrailScenario[] = lines
                .filter(line => line.trim())
                .map(line => {
                    const [prompt, expectedOutcome, category, riskLevel, notes] = line.split(',');
                    return {
                        prompt: prompt?.replace(/"/g, '') || '',
                        expectedOutcome: expectedOutcome?.replace(/"/g, '') as 'block' | 'allow' | 'unknown' || 'unknown',
                        category: category?.replace(/"/g, '') || '',
                        riskLevel: riskLevel?.replace(/"/g, '') as 'low' | 'medium' | 'high' || 'medium',
                        notes: notes?.replace(/"/g, '') || ''
                    };
                });

            setCsvScenarios(scenarios);
            setCurrentScenarioIndex(0);
            if (scenarios.length > 0) {
                setPrompt(scenarios[0].prompt);
            }
        };
        reader.readAsText(file);
    };

    // Guardrail evaluation function using the guardrail service
    const evaluateWithGuardrail = async (text: string): Promise<GuardrailOutput> => {
        return await guardrailService.evaluate(text, selectedGuardrail);
    };

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
                englishPrompt: prompt.trim(),
                translatedPrompt: null,
                targetLanguage: selectedLanguage,
                guardrailModel: selectedGuardrail,
                llmModel: selectedModel,
                englishLlmResponse: null,
                englishGuardrailResult: null,
                englishGenerationTime: null,
                translatedLlmResponse: null,
                translatedGuardrailResult: null,
                translatedGenerationTime: null,
                safetyDisparity: false,
                disparityAnalysis: null
            };

            setCurrentResult(result);

            // Step 1: Generate English LLM response
            const englishStartTime = Date.now();
            const englishResponse = await generateLlmResponse(prompt.trim(), selectedModel);
            const englishTime = (Date.now() - englishStartTime) / 1000;

            // Step 2: Evaluate English response with guardrail
            const englishGuardrailResult = await evaluateWithGuardrail(englishResponse);

            // Update result
            result.englishLlmResponse = englishResponse;
            result.englishGuardrailResult = englishGuardrailResult;
            result.englishGenerationTime = englishTime;
            setCurrentResult({ ...result });

            // Step 3: Translate prompt if target language is not English
            if (selectedLanguage !== 'english') {
                const translatedPrompt = await translateText(prompt.trim(), selectedLanguage);
                result.translatedPrompt = translatedPrompt;

                // Step 4: Generate translated LLM response
                const translatedStartTime = Date.now();
                const translatedResponse = await generateLlmResponse(translatedPrompt, selectedModel);
                const translatedTime = (Date.now() - translatedStartTime) / 1000;

                // Step 5: Evaluate translated response with guardrail
                const translatedGuardrailResult = await evaluateWithGuardrail(translatedResponse);

                // Update result
                result.translatedLlmResponse = translatedResponse;
                result.translatedGuardrailResult = translatedGuardrailResult;
                result.translatedGenerationTime = translatedTime;

                // Step 6: Analyze disparity
                const hasDisparity = englishGuardrailResult.valid !== translatedGuardrailResult.valid;
                result.safetyDisparity = hasDisparity;

                if (hasDisparity) {
                    result.disparityAnalysis = `Safety disparity detected: Content ${englishGuardrailResult.valid ? 'allowed' : 'blocked'} in English but ${translatedGuardrailResult.valid ? 'allowed' : 'blocked'} in ${selectedLanguage}. This indicates potential inconsistency in safety guardrail effectiveness across languages.`;
                }
            } else {
                // For English-only evaluation
                result.translatedPrompt = prompt.trim();
                result.translatedLlmResponse = englishResponse;
                result.translatedGuardrailResult = englishGuardrailResult;
                result.translatedGenerationTime = englishTime;
            }

            setCurrentResult({ ...result });
            saveEvaluation(result);

        } catch (error) {
            console.error('Evaluation failed:', error);
            alert('Evaluation failed. Please try again.');
        } finally {
            setIsEvaluating(false);
        }
    };

    const nextScenario = () => {
        if (currentScenarioIndex < csvScenarios.length - 1) {
            const nextIndex = currentScenarioIndex + 1;
            setCurrentScenarioIndex(nextIndex);
            setPrompt(csvScenarios[nextIndex].prompt);
            setCurrentResult(null);
        }
    };

    const previousScenario = () => {
        if (currentScenarioIndex > 0) {
            const prevIndex = currentScenarioIndex - 1;
            setCurrentScenarioIndex(prevIndex);
            setPrompt(csvScenarios[prevIndex].prompt);
            setCurrentResult(null);
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
                    <p className="text-muted-foreground">Test LLM safety guardrails across multiple languages</p>
                </div>
            </div>

            {/* Configuration Panel */}
            <div className="bg-card text-card-foreground p-6 rounded-xl shadow-md border border-border mb-6">
                <h2 className="text-lg font-semibold mb-4">Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <label className="block text-sm font-medium text-foreground mb-2">Guardrail Model</label>
                        <select
                            value={selectedGuardrail}
                            onChange={(e) => setSelectedGuardrail(e.target.value as GuardrailName)}
                            className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                        >
                            {AVAILABLE_GUARDRAILS.filter(g => g.available).map((guardrail) => (
                                <option key={guardrail.id} value={guardrail.id}>
                                    {guardrail.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Language Selection */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Target Language</label>
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="w-full p-2 border border-border rounded-lg bg-background text-foreground"
                        >
                            <option value="english">English (baseline)</option>
                            {AVAILABLE_NATIVE_LANGUAGES.map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Input Panel */}
            <div className="bg-card text-card-foreground p-6 rounded-xl shadow-md border border-border mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Input</h2>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center cursor-pointer text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors duration-200">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload CSV
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleCsvUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>

                {/* CSV Navigation */}
                {csvScenarios.length > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-blue-800 dark:text-blue-200">
                                Scenario {currentScenarioIndex + 1} of {csvScenarios.length}
                            </span>
                            <div className="flex space-x-2">
                                <button
                                    onClick={previousScenario}
                                    disabled={currentScenarioIndex === 0}
                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={nextScenario}
                                    disabled={currentScenarioIndex === csvScenarios.length - 1}
                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Prompt Input */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Test Prompt
                        <Tooltip text="Enter a prompt to test for safety guardrail effectiveness across languages" />
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
                    disabled={!prompt.trim() || isEvaluating}
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
            </div>

            {/* Results Panel */}
            {currentResult && (
                <div className="space-y-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <GuardrailResultCard
                            title="English Evaluation"
                            llmResponse={currentResult.englishLlmResponse}
                            guardrailResult={currentResult.englishGuardrailResult}
                            isLoading={isEvaluating && !currentResult.englishLlmResponse}
                            generationTime={currentResult.englishGenerationTime}
                        />

                        {selectedLanguage !== 'english' && (
                            <GuardrailResultCard
                                title={`${AVAILABLE_NATIVE_LANGUAGES.find(l => l.code === selectedLanguage)?.name || selectedLanguage} Evaluation`}
                                llmResponse={currentResult.translatedLlmResponse}
                                guardrailResult={currentResult.translatedGuardrailResult}
                                isLoading={isEvaluating && !currentResult.translatedLlmResponse}
                                generationTime={currentResult.translatedGenerationTime}
                            />
                        )}
                    </div>

                    {/* Safety Disparity Analysis */}
                    {!isEvaluating && currentResult.safetyDisparity && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3">
                                ⚠️ Safety Disparity Detected
                            </h3>
                            <p className="text-red-700 dark:text-red-300 mb-4">
                                {currentResult.disparityAnalysis}
                            </p>
                            <div className="text-sm text-red-600 dark:text-red-400">
                                <p className="font-medium mb-2">Potential Implications:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Users may receive inconsistent safety protection based on their language</li>
                                    <li>Vulnerable populations may be disproportionately affected</li>
                                    <li>Content moderation may be less effective in non-English languages</li>
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
                                            {evaluation.guardrailModel} • {evaluation.targetLanguage} •
                                            {evaluation.timestamp.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {evaluation.safetyDisparity && (
                                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded">
                                                Disparity
                                            </span>
                                        )}
                                        <span className={`px-2 py-1 text-xs rounded ${
                                            evaluation.englishGuardrailResult?.valid
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {evaluation.englishGuardrailResult?.valid ? 'Safe' : 'Blocked'}
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
