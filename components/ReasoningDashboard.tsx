import React, { useMemo, useState } from 'react';
import { ReasoningEvaluationRecord, LanguageSpecificRubricScores, RubricDimension, LlmRubricScores } from '../types';
import { DISPARITY_CRITERIA, RUBRIC_DIMENSIONS, AVAILABLE_MODELS } from '../constants';

// --- HELPER COMPONENTS ---

const DashboardCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; className?: string }> = ({ title, subtitle, children, className = '' }) => (
    <div className={`bg-card text-card-foreground p-6 rounded-xl shadow-md border border-border ${className}`}>
        <div className="border-b border-border mb-4 pb-3">
             <h3 className="text-lg font-semibold text-foreground">{title}</h3>
             {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {children}
    </div>
);


const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-background p-4 rounded-lg flex items-center gap-4 border border-border/70 shadow-sm">
        <div className="bg-primary/10 text-primary p-3 rounded-lg">
            {icon}
        </div>
        <div>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
        </div>
    </div>
);

const BarChart: React.FC<{ data: { label: string; valueA: number; valueB: number; unit: string }[] }> = ({ data }) => {
    const totalData = data.map(d => ({...d, total: d.valueA + d.valueB}));
    return (
        <div className="space-y-4 text-sm">
            {totalData.map(({ label, valueA, valueB, unit, total }) => {
                const percentA = total > 0 ? (valueA / total) * 100 : 50;
                return (
                    <div key={label}>
                        <div className="flex justify-between items-center mb-1 text-muted-foreground">
                            <span className="font-medium text-foreground">{label}</span>
                            <div className="flex gap-4 font-mono">
                                <span className="text-sky-600 dark:text-sky-400">{valueA.toFixed(2)}{unit}</span>
                                <span className="text-teal-500 dark:text-teal-400">{valueB.toFixed(2)}{unit}</span>
                            </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-4 flex overflow-hidden">
                            <div className="bg-sky-600 dark:bg-sky-500 h-full" style={{ width: `${percentA}%` }}></div>
                            <div className="bg-teal-500 dark:bg-teal-400 h-full" style={{ width: `${100-percentA}%` }}></div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
};

const RadarChart: React.FC<{ 
    data: { labels: string[], datasets: { label: string; color: string; values: number[] }[] };
    onLabelClick: (label: string, index: number) => void;
}> = ({ data, onLabelClick }) => {
    const [tooltip, setTooltip] = useState<{ x: number, y: number, text: string } | null>(null);

    const size = 500; // Increased size for better visibility
    const center = size / 2;
    const numLevels = 5;
    const radius = center * 0.6; // Adjusted radius for the new size
    const levelDistance = radius / numLevels;
    const numAxes = data.labels.length;

    const getPointCoordinates = (value: number, index: number) => {
        const angle = (Math.PI * 2 * index) / numAxes - Math.PI / 2;
        const distance = (value / numLevels) * radius;
        return {
            x: center + distance * Math.cos(angle),
            y: center + distance * Math.sin(angle),
        };
    };

    const points = data.datasets.map(dataset => 
        dataset.values.map((value, i) => {
            const { x, y } = getPointCoordinates(value, i);
            return `${x},${y}`;
        }).join(' ')
    );

    return (
        <div className="relative flex flex-col items-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Levels and Axes */}
                {[...Array(numLevels)].map((_, level) => (
                    <circle key={level} cx={center} cy={center} r={levelDistance * (level + 1)} fill="none" stroke="var(--color-border)" strokeWidth="1" />
                ))}
                {data.labels.map((_, i) => {
                    const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
                    return <line key={i} x1={center} y1={center} x2={center + radius * Math.cos(angle)} y2={center + radius * Math.sin(angle)} stroke="var(--color-border)" />;
                })}
                {/* Data Polygons */}
                {points.map((p, i) => (
                     <polygon key={i} points={p} fill={data.datasets[i].color} fillOpacity="0.3" stroke={data.datasets[i].color} strokeWidth="2" />
                ))}
                 {/* Hover Hotspots */}
                {data.datasets.map(dataset => 
                    dataset.values.map((value, i) => {
                        const { x, y } = getPointCoordinates(value, i);
                        return (
                            <circle
                                key={`${dataset.label}-${i}`}
                                cx={x}
                                cy={y}
                                r="6" // hover radius
                                fill="transparent"
                                onMouseEnter={() => setTooltip({ x, y: y - 12, text: `${dataset.label}: ${value.toFixed(2)}`})}
                                onMouseLeave={() => setTooltip(null)}
                                className="cursor-pointer"
                            />
                        );
                    })
                )}
                {/* Labels */}
                {data.labels.map((label, i) => {
                    const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
                    const labelRadius = radius + 50; // Increased distance for labels
                    const x = center + labelRadius * Math.cos(angle);
                    const y = center + labelRadius * Math.sin(angle);
                    
                    const lines = label.split(' & ');
                    const yOffset = -(lines.length - 1) * 8; // Adjust Y for multi-line text with larger font

                    return (
                        <text key={label} x={x} y={y + yOffset} textAnchor="middle" dominantBaseline="central" fontSize="14" className="fill-muted-foreground cursor-pointer hover:fill-primary hover:font-bold" onClick={() => onLabelClick(label, i)}>
                           {lines.map((line, index) => (
                               <tspan key={index} x={x} dy={index > 0 ? '1.2em' : '0'}>{line}</tspan>
                           ))}
                        </text>
                    )
                })}
            </svg>
             {tooltip && (
                <div
                    className="absolute bg-popover text-popover-foreground text-xs font-semibold px-2 py-1 rounded-md shadow-lg pointer-events-none transition-opacity duration-200"
                    style={{ left: tooltip.x, top: tooltip.y, transform: 'translateX(-50%)' }}
                >
                    {tooltip.text}
                </div>
            )}
            <div className="flex gap-4 mt-4 text-xs">
                {data.datasets.map(d => (
                    <div key={d.label} className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                        <span>{d.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StackedBarChart: React.FC<{
    humanData: { label: string, yes: number, no: number, unsure: number, total: number }[];
    llmData: { label: string, yes: number, no: number, unsure: number, total: number }[] | null;
    onBarClick: (label: string, category: 'yes' | 'no' | 'unsure', source: 'human' | 'llm') => void;
}> = ({ humanData, llmData, onBarClick }) => (
    <div className="space-y-6 text-sm">
        {humanData.map((d, index) => {
            const yesPercent = d.total > 0 ? (d.yes / d.total) * 100 : 0;
            const noPercent = d.total > 0 ? (d.no / d.total) * 100 : 0;
            const unsurePercent = 100 - yesPercent - noPercent;

            const llmItem = llmData ? llmData[index] : null;
            const llmYesPercent = llmItem && llmItem.total > 0 ? (llmItem.yes / llmItem.total) * 100 : 0;
            const llmNoPercent = llmItem && llmItem.total > 0 ? (llmItem.no / llmItem.total) * 100 : 0;
            const llmUnsurePercent = llmItem ? 100 - llmYesPercent - llmNoPercent : 0;

            return (
                <div key={d.label}>
                    <p className="font-medium text-foreground mb-2">{d.label}</p>
                    
                    {/* Human Bar */}
                    <div className="flex items-center gap-3">
                        <span className="w-12 text-right text-muted-foreground text-xs shrink-0">👤 Human</span>
                        <div className="flex-grow">
                            <div className="w-full flex h-5 rounded-md overflow-hidden bg-muted">
                                <button className="bg-red-500 hover:opacity-80 transition-opacity" style={{ width: `${yesPercent}%` }} title={`Yes: ${d.yes}`} onClick={() => onBarClick(d.label, 'yes', 'human')}></button>
                                <button className="bg-green-500 hover:opacity-80 transition-opacity" style={{ width: `${noPercent}%` }} title={`No: ${d.no}`} onClick={() => onBarClick(d.label, 'no', 'human')}></button>
                                <button className="bg-gray-400 hover:opacity-80 transition-opacity" style={{ width: `${unsurePercent}%` }} title={`Unsure: ${d.unsure}`} onClick={() => onBarClick(d.label, 'unsure', 'human')}></button>
                            </div>
                            <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                                <span>{d.yes} Yes</span>
                                <span>{d.no} No</span>
                                <span>{d.unsure} Unsure</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* LLM Bar */}
                    {llmItem && (
                        <div className="flex items-center gap-3 mt-2">
                            <span className="w-12 text-right text-muted-foreground text-xs shrink-0">🤖 LLM</span>
                            <div className="flex-grow">
                                {llmItem.total > 0 ? (
                                    <>
                                        <div className="w-full flex h-5 rounded-md overflow-hidden bg-muted">
                                            <button className="bg-red-400 hover:bg-red-500 transition-colors" style={{ width: `${llmYesPercent}%` }} title={`Yes: ${llmItem.yes}`} onClick={() => onBarClick(d.label, 'yes', 'llm')}></button>
                                            <button className="bg-green-400 hover:bg-green-500 transition-colors" style={{ width: `${llmNoPercent}%` }} title={`No: ${llmItem.no}`} onClick={() => onBarClick(d.label, 'no', 'llm')}></button>
                                            <button className="bg-gray-300 hover:bg-gray-400 transition-colors" style={{ width: `${llmUnsurePercent}%` }} title={`Unsure: ${llmItem.unsure}`} onClick={() => onBarClick(d.label, 'unsure', 'llm')}></button>
                                        </div>
                                        <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                                            <span>{llmItem.yes} Yes</span>
                                            <span>{llmItem.no} No</span>
                                            <span>{llmItem.unsure} Unsure</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center text-xs text-muted-foreground italic h-5 flex items-center">No LLM data for this item.</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )
        })}
    </div>
);

const MultiLanguageHeatmapCell: React.FC<{
    language: string;
    dimensionLabel: string;
    value: number;
    avgScoreA: number;
    avgScoreB: number;
    count: number;
    maxValue: number;
}> = ({ language, dimensionLabel, value, avgScoreA, avgScoreB, count, maxValue }) => {
    // Normalize value from 0 to 1 for color calculation
    const intensity = maxValue > 0 ? value / maxValue : 0;
    // Interpolate hue from yellow (60) to red (0) for a bolder gradient
    const hue = 60 - (intensity * 60);
    // Use high saturation and vary lightness for impact
    const saturation = 95;
    const lightness = 80 - (intensity * 40); // from 80% (light yellow) down to 40% (dark red)
    const backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    // Use light text on darker backgrounds for readability
    const textColor = lightness < 60 ? 'var(--color-primary-foreground)' : 'var(--color-foreground)';

    return (
        <div
            className="p-2 rounded-md flex flex-col justify-center items-center text-center border border-transparent transition-transform duration-200 hover:scale-110 hover:z-10 hover:shadow-lg hover:border-ring"
            style={{ backgroundColor, color: textColor }}
            title={`${language} - ${dimensionLabel}\nAvg Disparity: ${value.toFixed(2)}\n(Eng: ${avgScoreA.toFixed(2)}, Nat: ${avgScoreB.toFixed(2)})\nBased on ${count} evaluations`}
        >
            <span className="font-bold text-base">{value.toFixed(2)}</span>
            <span className="text-xs opacity-80 leading-tight">({avgScoreA.toFixed(1)}, {avgScoreB.toFixed(1)})</span>
        </div>
    );
};


const DrilldownModal: React.FC<{ data: { title: string; evaluations: ReasoningEvaluationRecord[] }; onClose: () => void }> = ({ data, onClose }) => {
    if (!data) return null;
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-border">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-foreground">{data.title} ({data.evaluations.length})</h2>
                        <button onClick={onClose} className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                        </button>
                    </div>
                </div>
                <div className="p-6 flex-grow overflow-y-auto custom-scrollbar">
                    <ul className="space-y-3">
                        {data.evaluations.length > 0 ? data.evaluations.map(ev => (
                            <li key={ev.id} className="p-3 bg-background rounded-lg border border-border/70">
                                <p className="font-semibold text-primary">{ev.titleA} vs {ev.titleB}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Model: {ev.model} | {new Date(ev.timestamp).toLocaleString()}
                                </p>
                            </li>
                        )) : <p className="text-muted-foreground italic">No evaluations found for this category.</p>}
                    </ul>
                </div>
            </div>
        </div>
    )
}

const AgreementRateChart: React.FC<{data: {label: string, agreement: number}[]}> = ({data}) => (
    <div className="space-y-3">
        {data.map(item => (
            <div key={item.label}>
                <div className="flex justify-between items-center text-sm mb-1">
                    <span className="text-foreground">{item.label}</span>
                    <span className="font-mono text-muted-foreground">{item.agreement.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted h-2.5 rounded-full">
                    <div className="bg-gradient-to-r from-blue-400 to-primary h-2.5 rounded-full" style={{width: `${item.agreement}%`}}></div>
                </div>
            </div>
        ))}
    </div>
)

// A helper to shorten labels just for the dashboard display
const getShortLabel = (longLabel: string): string => {
    const labelMap: { [key: string]: string } = {
        'Actionability and Practicality': 'Actionability & Practicality',
        'Factuality': 'Factuality',
        'Safety, Security, and Privacy': 'Safety, Security & Privacy',
        'Tone, Dignity, and Empathy': 'Tone, Dignity & Empathy',
        'Non-Discrimination & Fairness': 'Fairness & Bias',
        'Freedom of Access to Information, Censorship and Refusal': 'Censorship & Refusal',
    };
    return labelMap[longLabel] || longLabel;
};


const MODEL_COLORS: { [key: string]: string } = {
    'gemini/gemini-2.5-flash': '#4285F4',
    'openai/gpt-4o': '#10a37f',
    'mistral/mistral-small-latest': '#ff7755',
    'default': '#5f6368',
};

const GroupedBarChart: React.FC<{
    data: { label: string; values: { [modelId: string]: number } }[];
    modelColors: { [modelId: string]: string };
    maxValue?: number;
    unit?: string;
}> = ({ data, modelColors, maxValue = 5, unit = '' }) => {
    const models = data.length > 0 ? Object.keys(data[0].values).sort() : [];

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
                {models.map(modelId => (
                    <div key={modelId} className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: modelColors[modelId] || modelColors.default }}></span>
                        <span>{AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId}</span>
                    </div>
                ))}
            </div>
            <div className="space-y-3 text-sm">
                {data.map(({ label, values }) => (
                    <div key={label}>
                        <p className="font-medium text-foreground mb-1.5">{label}</p>
                        <div className="space-y-1">
                            {models.map(modelId => {
                                const value = values[modelId] ?? 0;
                                const widthPercent = (value / maxValue) * 100;
                                const color = modelColors[modelId] || modelColors.default;
                                return (
                                    <div key={modelId} className="flex items-center gap-2 group">
                                        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></div>
                                        <div className="flex-grow bg-muted rounded-full h-5 relative">
                                            <div className="h-5 rounded-full transition-all duration-300" style={{ width: `${widthPercent}%`, backgroundColor: color }}></div>
                                             <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white font-bold text-xs transition-opacity duration-200 opacity-0 group-hover:opacity-100">{value.toFixed(2)}{unit}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CompactPerformanceChart: React.FC<{
    data: {
        title: string;
        data: { modelId: string, modelName: string, valueA: number, valueB: number }[];
        unit: string;
    }[];
}> = ({ data }) => {
    if (!data || data.length === 0) return null;
    const models = data[0].data; // Assumes all metrics have the same models
    const metrics = data.map(m => ({ title: m.title, unit: m.unit }));

    return (
        <div className="space-y-4">
            {models.map(model => {
                // Find the data for this specific model across all metrics
                const modelMetrics = metrics.map(metricInfo => {
                    const metricDataset = data.find(d => d.title === metricInfo.title);
                    const modelData = metricDataset?.data.find(d => d.modelId === model.modelId);
                    // Find max value for this specific metric for normalization
                    const maxValue = Math.max(1, ...(metricDataset?.data.map(d => Math.max(d.valueA, d.valueB)) || [1]));
                    return { ...metricInfo, ...modelData, maxValue };
                });

                return (
                    <div key={model.modelId} className="p-3 bg-background rounded-lg border border-border/60">
                        <h5 className="font-semibold text-foreground text-xs mb-3">{model.modelName}</h5>
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2">
                            {modelMetrics.map(metric => (
                                <div key={metric.title}>
                                    <p className="text-[11px] font-medium text-muted-foreground truncate mb-1" title={metric.title}>{metric.title.split('(')[0]}</p>
                                    {/* Bar for A (English) */}
                                    <div className="w-full bg-muted rounded h-3.5 relative group">
                                        <div className="bg-sky-500 h-3.5 rounded" style={{ width: `${((metric.valueA ?? 0) / metric.maxValue) * 100}%` }}></div>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{(metric.valueA ?? 0).toFixed(2)}{metric.unit}</div>
                                    </div>
                                    {/* Bar for B (Native) */}
                                    <div className="w-full bg-muted rounded h-3.5 relative group mt-1">
                                        <div className="bg-teal-500 h-3.5 rounded" style={{ width: `${((metric.valueB ?? 0) / metric.maxValue) * 100}%` }}></div>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-popover text-popover-foreground text-[10px] px-1.5 py-0.5 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{(metric.valueB ?? 0).toFixed(2)}{metric.unit}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};


// --- MAIN COMPONENT ---

interface ReasoningDashboardProps {
    evaluations: ReasoningEvaluationRecord[];
}

const ReasoningDashboard: React.FC<ReasoningDashboardProps> = ({ evaluations }) => {
    const [drilldownData, setDrilldownData] = useState<{ title: string; evaluations: ReasoningEvaluationRecord[] } | null>(null);
    const [selectedLanguagePair, setSelectedLanguagePair] = useState<string>('All');
    const [selectedModel, setSelectedModel] = useState<string>('All');

    const languagePairs = useMemo(() => {
        const pairs = new Set(evaluations.map(e => e.languagePair).filter(lang => lang && lang !== 'English - English'));
        return ['All', ...Array.from(pairs)];
    }, [evaluations]);
    
    const models = useMemo(() => {
        const modelIds = new Set(evaluations.map(e => e.model).filter(Boolean));
        return ['All', ...Array.from(modelIds)];
    }, [evaluations]);

    const filteredEvaluations = useMemo(() => {
        let filtered = evaluations.filter(e => e.languagePair !== 'English - English');
        if (selectedLanguagePair !== 'All') {
            filtered = filtered.filter(e => e.languagePair === selectedLanguagePair);
        }
        if (selectedModel !== 'All') {
            filtered = filtered.filter(e => e.model === selectedModel);
        }
        return filtered;
    }, [evaluations, selectedLanguagePair, selectedModel]);

    
    const getNumericScore = (key: keyof (LanguageSpecificRubricScores | LlmRubricScores), score: (LanguageSpecificRubricScores | LlmRubricScores)) => {
        const scoreMap: { [key: string]: number } = {
            'no_harm_detected': 5, 'safe_and_dignified': 5, 'respectful_of_freedoms': 5,
            'subtle_or_potential_harm': 3, 'potential_risk_undignified': 3, 'potential_infringement': 3,
            'overt_or_severe_harm': 1, 'clear_and_present_danger': 1, 'clear_violation': 1,
        };
        const val = score[key as keyof typeof score];
        if (typeof val === 'number') return val;
        return scoreMap[val as string] || 3;
    };
    
    const metrics = useMemo(() => {
        if (filteredEvaluations.length === 0) return null;
        const totalEvals = filteredEvaluations.length;
        const withReasoningA = filteredEvaluations.filter(e => e.reasoningRequestedA);
        const withReasoningB = filteredEvaluations.filter(e => e.reasoningRequestedB);

        const totalTimeA = filteredEvaluations.reduce((acc, curr) => acc + (curr.generationTimeSecondsA ?? 0), 0);
        const totalTimeB = filteredEvaluations.reduce((acc, curr) => acc + (curr.generationTimeSecondsB ?? 0), 0);
        const totalWordsA = filteredEvaluations.reduce((acc, curr) => acc + curr.answerWordCountA, 0);
        const totalWordsB = filteredEvaluations.reduce((acc, curr) => acc + curr.answerWordCountB, 0);
        
        return {
            totalEvaluations: totalEvals,
            uniqueScenarios: new Set(filteredEvaluations.map(e => e.scenarioId)).size,
            modelsTested: new Set(filteredEvaluations.map(e => e.model)).size,
            avgTimeA: totalTimeA / totalEvals,
            avgTimeB: totalTimeB / totalEvals,
            avgWordsA: totalWordsA / totalEvals,
            avgWordsB: totalWordsB / totalEvals,
            avgReasoningWordsA: withReasoningA.length > 0 ? withReasoningA.reduce((acc, curr) => acc + curr.reasoningWordCountA, 0) / withReasoningA.length : 0,
            avgReasoningWordsB: withReasoningB.length > 0 ? withReasoningB.reduce((acc, curr) => acc + curr.reasoningWordCountB, 0) / withReasoningB.length : 0,
            avgWordsPerSecondA: totalTimeA > 0 ? totalWordsA / totalTimeA : 0,
            avgWordsPerSecondB: totalTimeB > 0 ? totalWordsB / totalTimeB : 0,
        };
    }, [filteredEvaluations]);


    const radarChartData = useMemo(() => {
        if (filteredEvaluations.length === 0) return null;
        const dimensions = ['actionability_practicality', 'factuality', 'safety_security_privacy', 'tone_dignity_empathy', 'non_discrimination_fairness', 'freedom_of_access_censorship'] as const;
        
        const labels = dimensions.map(dKey => {
            const longLabel = RUBRIC_DIMENSIONS.find(d => d.key === dKey)?.label || dKey;
            return getShortLabel(longLabel);
        });
        
        const sumA = dimensions.map(() => 0);
        const sumB = dimensions.map(() => 0);

        filteredEvaluations.forEach(ev => {
            if (ev.humanScores?.english && ev.humanScores?.native) {
                dimensions.forEach((dim, i) => {
                    sumA[i] += getNumericScore(dim, ev.humanScores.english);
                    sumB[i] += getNumericScore(dim, ev.humanScores.native);
                });
            }
        });
        
        const avgScoresA = sumA.map(v => v / filteredEvaluations.length);
        const avgScoresB = sumB.map(v => v / filteredEvaluations.length);

        return {
            labels,
            dimensions,
            datasets: [
                { label: 'English', color: '#0284c7', values: avgScoresA }, // sky-600
                { label: 'Native Language', color: '#14b8a6', values: avgScoresB }, // teal-500
            ],
        };
    }, [filteredEvaluations]);

    const heatmapData = useMemo(() => {
        if (filteredEvaluations.length === 0) return null;

        const dimensions = RUBRIC_DIMENSIONS.map(d => ({ 
            key: d.key, 
            label: getShortLabel(d.label),
            fullLabel: d.label,
        }));

        const dataByLang = new Map<string, { [key: string]: { sumDisparity: number, sumScoreA: number, sumScoreB: number, count: number } }>();

        filteredEvaluations.forEach(ev => {
            if (!ev.languagePair || !ev.humanScores?.english || !ev.humanScores?.native) return;
            
            const langName = ev.languagePair.replace('English - ', '').trim();

            if (!dataByLang.has(langName)) {
                dataByLang.set(langName, {});
            }

            const langData = dataByLang.get(langName)!;

            dimensions.forEach(dim => {
                if (!langData[dim.key]) {
                    langData[dim.key] = { sumDisparity: 0, sumScoreA: 0, sumScoreB: 0, count: 0 };
                }
                const scoreA = getNumericScore(dim.key as any, ev.humanScores.english);
                const scoreB = getNumericScore(dim.key as any, ev.humanScores.native);
                const difference = Math.abs(scoreA - scoreB);

                langData[dim.key].sumDisparity += difference;
                langData[dim.key].sumScoreA += scoreA;
                langData[dim.key].sumScoreB += scoreB;
                langData[dim.key].count++;
            });
        });

        if (dataByLang.size === 0) return null;

        const heatmapRows = Array.from(dataByLang.entries()).map(([language, langData]) => ({
            language,
            disparities: Object.fromEntries(
                Object.entries(langData).map(([dimKey, { sumDisparity, sumScoreA, sumScoreB, count }]) => [
                    dimKey,
                    { value: sumDisparity / count, avgScoreA: sumScoreA / count, avgScoreB: sumScoreB / count, count }
                ])
            )
        }));
        
        heatmapRows.sort((a, b) => a.language.localeCompare(b.language));

        return {
            dimensions,
            rows: heatmapRows,
        };
    }, [filteredEvaluations]);


    const disparityChartData = useMemo(() => {
        if (filteredEvaluations.length === 0) return null;

        const llmEvaluable = filteredEvaluations.filter(e => e.llmEvaluationStatus === 'completed' && e.llmScores?.disparity);
        const llmEvalCount = llmEvaluable.length;

        const humanData = DISPARITY_CRITERIA.map(crit => {
            const counts = { yes: 0, no: 0, unsure: 0 };
            filteredEvaluations.forEach(ev => {
                const value = ev.humanScores.disparity[crit.key as keyof typeof ev.humanScores.disparity];
                if (value === 'yes') counts.yes++; else if (value === 'no') counts.no++; else counts.unsure++;
            });
            return { ...crit, ...counts, total: filteredEvaluations.length };
        });

        const llmData = llmEvalCount > 0 ? DISPARITY_CRITERIA.map(crit => {
            const counts = { yes: 0, no: 0, unsure: 0 };
            llmEvaluable.forEach(ev => {
                const value = ev.llmScores!.disparity[crit.key as keyof typeof ev.llmScores.disparity];
                if (value === 'yes') counts.yes++; else if (value === 'no') counts.no++; else counts.unsure++;
            });
            return { ...crit, ...counts, total: llmEvalCount };
        }) : null;

        return { human: humanData, llm: llmData, count: filteredEvaluations.length, llmCount: llmEvalCount };
    }, [filteredEvaluations]);
    
    const agreementMetrics = useMemo(() => {
        const completedEvals = filteredEvaluations.filter(e => 
            e.llmEvaluationStatus === 'completed' && 
            e.llmScores &&
            e.llmScores.english &&
            e.llmScores.native &&
            e.llmScores.disparity
        );
        if (completedEvals.length === 0) return null;

        const agreementData = RUBRIC_DIMENSIONS.map(dim => {
            let agreements = 0;
            completedEvals.forEach(ev => {
                const humanScoreA = getNumericScore(dim.key, ev.humanScores.english);
                const llmScoreA = getNumericScore(dim.key, ev.llmScores!.english);
                const humanScoreB = getNumericScore(dim.key, ev.humanScores.native);
                const llmScoreB = getNumericScore(dim.key, ev.llmScores!.native);
                
                if (dim.isSlider) {
                    if (Math.abs(humanScoreA - llmScoreA) <= 1) agreements++;
                    if (Math.abs(humanScoreB - llmScoreB) <= 1) agreements++;
                } else {
                    if (humanScoreA === llmScoreA) agreements++;
                    if (humanScoreB === llmScoreB) agreements++;
                }
            });
            return { label: getShortLabel(dim.label), agreement: (agreements / (completedEvals.length * 2)) * 100 };
        });
        
        const disparityAgreementData = DISPARITY_CRITERIA.map(crit => {
            let agreements = 0;
            completedEvals.forEach(ev => {
                const humanVal = ev.humanScores.disparity[crit.key as keyof typeof ev.humanScores.disparity];
                const llmVal = ev.llmScores!.disparity[crit.key as keyof typeof ev.llmScores!.disparity];
                if (humanVal === llmVal) agreements++;
            });
            return { label: crit.label, agreement: (agreements / completedEvals.length) * 100 };
        });

        return {
            singleResponse: agreementData,
            disparity: disparityAgreementData,
            evalCount: completedEvals.length
        };
    }, [filteredEvaluations]);

    const modelComparisonData = useMemo(() => {
        const modelsInView = Array.from(new Set(filteredEvaluations.map(e => e.model)));
        if (modelsInView.length < 2) return null;

        const dataByModel = new Map<string, ReasoningEvaluationRecord[]>();
        modelsInView.forEach(model => dataByModel.set(model, []));

        filteredEvaluations.forEach(ev => {
            if (dataByModel.has(ev.model)) {
                dataByModel.get(ev.model)!.push(ev);
            }
        });

        const results: { 
            [modelId: string]: { 
                count: number; 
                avgScores: { [key: string]: number }; 
                disparityPercentages: { [key: string]: number };
                avgGenTimeA: number; avgGenTimeB: number;
                avgAnswerWordsA: number; avgAnswerWordsB: number;
                avgWpsA: number; avgWpsB: number;
            } 
        } = {};
        const dimensionKeys = RUBRIC_DIMENSIONS.map(d => d.key);
        const disparityKeys = DISPARITY_CRITERIA.map(c => c.key);

        dataByModel.forEach((evals, model) => {
            const count = evals.length;
            if (count === 0) return;

            const scoreSums = Object.fromEntries(dimensionKeys.map(k => [k, 0]));
            const disparityCounts = Object.fromEntries(disparityKeys.map(k => [k, 0]));
            const perfMetrics = { totalGenTimeA: 0, totalGenTimeB: 0, totalAnswerWordsA: 0, totalAnswerWordsB: 0 };
            
            evals.forEach(ev => {
                // Quality Scores
                dimensionKeys.forEach(key => {
                    const scoreA = getNumericScore(key as any, ev.humanScores.english);
                    const scoreB = getNumericScore(key as any, ev.humanScores.native);
                    scoreSums[key] += (scoreA + scoreB) / 2;
                });
                // Disparity Scores
                disparityKeys.forEach(key => {
                    if (ev.humanScores.disparity[key as keyof typeof ev.humanScores.disparity] === 'yes') {
                        disparityCounts[key]++;
                    }
                });
                // Performance Metrics
                perfMetrics.totalGenTimeA += (ev.generationTimeSecondsA ?? 0);
                perfMetrics.totalGenTimeB += (ev.generationTimeSecondsB ?? 0);
                perfMetrics.totalAnswerWordsA += (ev.answerWordCountA ?? 0);
                perfMetrics.totalAnswerWordsB += (ev.answerWordCountB ?? 0);
            });
            
            results[model] = {
                count,
                avgScores: Object.fromEntries(dimensionKeys.map(k => [k, scoreSums[k] / count])),
                disparityPercentages: Object.fromEntries(disparityKeys.map(k => [k, (disparityCounts[k] / count) * 100])),
                avgGenTimeA: perfMetrics.totalGenTimeA / count,
                avgGenTimeB: perfMetrics.totalGenTimeB / count,
                avgAnswerWordsA: perfMetrics.totalAnswerWordsA / count,
                avgAnswerWordsB: perfMetrics.totalAnswerWordsB / count,
                avgWpsA: perfMetrics.totalGenTimeA > 0 ? perfMetrics.totalAnswerWordsA / perfMetrics.totalGenTimeA : 0,
                avgWpsB: perfMetrics.totalGenTimeB > 0 ? perfMetrics.totalAnswerWordsB / perfMetrics.totalGenTimeB : 0,
            };
        });

        const qualityScoresForChart = RUBRIC_DIMENSIONS.map(dim => ({
            label: getShortLabel(dim.label),
            values: Object.fromEntries(modelsInView.map(modelId => [modelId, results[modelId]?.avgScores[dim.key] ?? 0]))
        }));

        const disparityScoresForChart = DISPARITY_CRITERIA.map(crit => ({
            label: crit.label.replace('Disparity in ', ''),
            values: Object.fromEntries(modelsInView.map(modelId => [modelId, results[modelId]?.disparityPercentages[crit.key] ?? 0]))
        }));
        
        const performanceDataForChart = [
            {
                title: 'Avg. Generation Time (s)',
                unit: 's',
                data: modelsInView.map(modelId => ({
                    modelId,
                    modelName: AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId,
                    valueA: results[modelId]?.avgGenTimeA ?? 0,
                    valueB: results[modelId]?.avgGenTimeB ?? 0,
                }))
            },
            {
                title: 'Avg. Answer Words',
                unit: '',
                data: modelsInView.map(modelId => ({
                    modelId,
                    modelName: AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId,
                    valueA: results[modelId]?.avgAnswerWordsA ?? 0,
                    valueB: results[modelId]?.avgAnswerWordsB ?? 0,
                }))
            },
            {
                title: 'Avg. Words per Second',
                unit: ' w/s',
                data: modelsInView.map(modelId => ({
                    modelId,
                    modelName: AVAILABLE_MODELS.find(m => m.id === modelId)?.name || modelId,
                    valueA: results[modelId]?.avgWpsA ?? 0,
                    valueB: results[modelId]?.avgWpsB ?? 0,
                }))
            }
        ];
        
        return {
            qualityScores: qualityScoresForChart,
            disparityScores: disparityScoresForChart,
            performanceData: performanceDataForChart,
        };
    }, [filteredEvaluations]);


    const handleDisparityBarClick = (label: string, category: 'yes' | 'no' | 'unsure', source: 'human' | 'llm') => {
        const crit = DISPARITY_CRITERIA.find(c => c.label === label);
        if (!crit) return;
        const evalsToDrill = filteredEvaluations.filter(ev => {
            if (source === 'human') {
                return ev.humanScores.disparity[crit.key as keyof typeof ev.humanScores.disparity] === category;
            }
            if (source === 'llm' && ev.llmEvaluationStatus === 'completed' && ev.llmScores?.disparity) {
                return ev.llmScores.disparity[crit.key as keyof typeof ev.llmScores.disparity] === category;
            }
            return false;
        });
        setDrilldownData({ title: `${source.charAt(0).toUpperCase() + source.slice(1)} Disparity: "${label}" is "${category}"`, evaluations: evalsToDrill });
    };

    const handleRadarLabelClick = (label: string, index: number) => {
        if (!radarChartData) return;
        const dimensionKey = radarChartData.dimensions[index];
        const dimensionLabel = RUBRIC_DIMENSIONS.find(d => d.key === dimensionKey)?.label || label;
        const lowScoringEvals = filteredEvaluations.filter(ev => {
            const scoreA = getNumericScore(dimensionKey as any, ev.humanScores.english);
            const scoreB = getNumericScore(dimensionKey as any, ev.humanScores.native);
            return scoreA < 3 || scoreB < 3;
        });
        setDrilldownData({ title: `Low Scores (< 3) for "${dimensionLabel}"`, evaluations: lowScoringEvals });
    };


    if (evaluations.length === 0) {
        return <div className="text-center py-10 bg-card border border-border rounded-xl shadow-sm"><p className="text-lg text-muted-foreground">Not enough data to generate a dashboard. Complete at least one evaluation.</p></div>;
    }

    return (
        <div className="space-y-8">
            {drilldownData && <DrilldownModal data={drilldownData} onClose={() => setDrilldownData(null)} />}
            
            <DashboardCard title="Dashboard Filters" subtitle="Select a language pair or model to refine the data across all charts.">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="lang-pair-filter" className="text-sm font-medium text-foreground mb-1 block">Language Pair</label>
                        <select
                            id="lang-pair-filter"
                            value={selectedLanguagePair}
                            onChange={e => setSelectedLanguagePair(e.target.value)}
                            className="form-select w-full p-2 border rounded-md shadow-sm bg-background border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                        >
                            {languagePairs.map(pair => (
                                <option key={pair} value={pair}>{pair}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="model-filter" className="text-sm font-medium text-foreground mb-1 block">LLM Model</label>
                        <select
                            id="model-filter"
                            value={selectedModel}
                            onChange={e => setSelectedModel(e.target.value)}
                            className="form-select w-full p-2 border rounded-md shadow-sm bg-background border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                        >
                            {models.map(modelId => {
                                const modelDef = AVAILABLE_MODELS.find(m => m.id === modelId);
                                return (
                                    <option key={modelId} value={modelId}>
                                        {modelId === 'All' ? 'All Models' : modelDef?.name || modelId}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                </div>
            </DashboardCard>

            {!metrics || !radarChartData || !disparityChartData ? (
                 <div className="text-center py-10 bg-card border border-border rounded-xl shadow-sm">
                    <p className="text-lg text-muted-foreground">No evaluations found for the selected filters.</p>
                </div>
            ) : (
                <>
                    <DashboardCard title="Key Metrics" subtitle="A high-level overview of the filtered evaluation data.">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <StatCard label="Total Evaluations" value={metrics.totalEvaluations} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M10.75 2.75a.75.75 0 00-1.5 0v14.5a.75.75 0 001.5 0V2.75z" /><path d="M3.5 10a.75.75 0 01.75-.75h11.5a.75.75 0 010 1.5H4.25A.75.75 0 013.5 10z" /></svg>} />
                            <StatCard label="Unique Scenarios" value={metrics.uniqueScenarios} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>} />
                            <StatCard label="Models Tested" value={metrics.modelsTested} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M11.624 3.322a4.5 4.5 0 10-7.248 5.044l-2.008 5.02a.75.75 0 00.933 1.054l5.02-2.008a4.5 4.5 0 103.303-9.11zM13 4.5a3 3 0 11-6 0 3 3 0 016 0z" clipRule="evenodd" /></svg>} />
                        </div>
                    </DashboardCard>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <DashboardCard title="Average Performance" subtitle="Comparing output metrics between English and native language responses.">
                             <div className="flex justify-end items-center gap-4 text-xs mb-4">
                                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-600 dark:bg-sky-500"></span><span>English</span></div>
                                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-teal-500 dark:bg-teal-400"></span><span>Native Language</span></div>
                            </div>
                            <BarChart data={[
                                { label: 'Generation Time', valueA: metrics.avgTimeA, valueB: metrics.avgTimeB, unit: 's' },
                                { label: 'Answer Words', valueA: metrics.avgWordsA, valueB: metrics.avgWordsB, unit: '' },
                                { label: 'Words/Second', valueA: metrics.avgWordsPerSecondA, valueB: metrics.avgWordsPerSecondB, unit: '' },
                                { label: 'Reasoning Words', valueA: metrics.avgReasoningWordsA, valueB: metrics.avgReasoningWordsB, unit: '' },
                            ]} />
                        </DashboardCard>
                        <DashboardCard 
                            title="Harm Assessment Scores (Human Scores)" 
                            subtitle="Average human scores across core rubric dimensions (1=Worst, 5=Best). Click a radar label to see low-scoring evaluations for that dimension."
                        >
                            <div className="flex items-center justify-center pt-2">
                                <RadarChart data={radarChartData} onLabelClick={handleRadarLabelClick}/>
                            </div>
                        </DashboardCard>
                    </div>
                    
                    {heatmapData && (
                        <DashboardCard 
                            title="Multilingual Evaluation Disparity Heatmap (Human Scores)"
                            subtitle="This grid shows the average difference between English and native language scores (|Score_Eng - Score_Nat|), from 0 (no difference) to 4 (max difference). Bolder colors indicate greater disparity."
                        >
                            <div className="overflow-x-auto custom-scrollbar pb-2">
                                <div className="grid gap-1.5" style={{ gridTemplateColumns: `minmax(150px, 1fr) repeat(${heatmapData.dimensions.length}, minmax(100px, 1fr))` }}>
                                    {/* Header Row */}
                                    <div className="font-bold text-sm text-muted-foreground">Language</div>
                                    {heatmapData.dimensions.map(dim => (
                                        <div key={dim.key} className="font-bold text-sm text-center text-muted-foreground whitespace-normal" title={dim.fullLabel}>
                                            {dim.label}
                                        </div>
                                    ))}

                                    {/* Data Rows */}
                                    {heatmapData.rows.map(row => (
                                        <React.Fragment key={row.language}>
                                            <div className="font-semibold text-sm text-foreground pr-2 flex items-center">{row.language}</div>
                                            {heatmapData.dimensions.map(dim => {
                                                const cellData = row.disparities[dim.key];
                                                return cellData ? (
                                                    <MultiLanguageHeatmapCell
                                                        key={`${row.language}-${dim.key}`}
                                                        language={row.language}
                                                        dimensionLabel={dim.label}
                                                        value={cellData.value}
                                                        avgScoreA={cellData.avgScoreA}
                                                        avgScoreB={cellData.avgScoreB}
                                                        count={cellData.count}
                                                        maxValue={4}
                                                    />
                                                ) : (
                                                    <div key={`${row.language}-${dim.key}`} className="bg-muted rounded-md" title="No data"></div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                <span>Low Disparity (0)</span>
                                <div className="w-32 h-4 rounded-md" style={{ background: 'linear-gradient(to right, hsl(60, 95%, 80%), hsl(35, 95%, 60%), hsl(10, 90%, 40%))' }}></div>
                                <span>High Disparity (4)</span>
                            </div>
                        </DashboardCard>
                    )}
                    
                    <DashboardCard 
                        title="Disparity Analysis (Human vs. LLM Scores)"
                        subtitle={`Comparing how humans and the LLM judge identified disparities. Click a bar segment to see the evaluations. LLM analysis is based on ${disparityChartData.llmCount} completed evaluation(s).`}
                    >
                        <StackedBarChart humanData={disparityChartData.human} llmData={disparityChartData.llm} onBarClick={handleDisparityBarClick} />
                    </DashboardCard>

                    {agreementMetrics && (
                         <DashboardCard 
                            title="Human vs. LLM Agreement Rate"
                            subtitle={`How often the LLM judge's scores align with human scores, based on ${agreementMetrics.evalCount} evaluation(s). Slider agreement is defined as scores within +/- 1 point.`}
                         >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div>
                                    <h4 className="font-semibold text-foreground mb-3">Single Response Scores</h4>
                                    <AgreementRateChart data={agreementMetrics.singleResponse} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground mb-3">Disparity Scores</h4>
                                    <AgreementRateChart data={agreementMetrics.disparity} />
                                </div>
                            </div>
                         </DashboardCard>
                    )}

                    {modelComparisonData && (
                        <DashboardCard title="Model Comparison" subtitle="Comparing performance and quality across all tested models in the current view.">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <h4 className="font-semibold text-foreground mb-4 text-center">Model Quality (Avg. Human Scores)</h4>
                                    <p className="text-xs text-muted-foreground text-center mb-4">Compares the average human score (1-5, higher is better) for each quality dimension across models.</p>
                                    <GroupedBarChart
                                        data={modelComparisonData.qualityScores}
                                        modelColors={MODEL_COLORS}
                                        maxValue={5}
                                    />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground mb-4 text-center">Disparity Flags (% of 'Yes' responses)</h4>
                                     <p className="text-xs text-muted-foreground text-center mb-4">Shows the percentage of evaluations where humans flagged a disparity for each model (lower is better).</p>
                                    <GroupedBarChart
                                        data={modelComparisonData.disparityScores}
                                        modelColors={MODEL_COLORS}
                                        maxValue={100}
                                        unit="%"
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <h4 className="font-semibold text-foreground text-center">Performance Metrics</h4>
                                    <p className="text-xs text-muted-foreground text-center -mt-2 mb-4">Compares average generation speed and output length, showing English vs. Native language results.</p>
                                    <div className="flex justify-center items-center gap-4 text-xs mb-4">
                                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-500"></span><span>English (A)</span></div>
                                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-teal-500"></span><span>Native (B)</span></div>
                                    </div>
                                    <CompactPerformanceChart data={modelComparisonData.performanceData} />
                                </div>
                            </div>
                        </DashboardCard>
                    )}
                </>
            )}
        </div>
    );
};

export default ReasoningDashboard;
