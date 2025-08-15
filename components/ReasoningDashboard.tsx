import React, { useMemo, useState } from 'react';
import { ReasoningEvaluationRecord, LanguageSpecificRubricScores, RubricDimension, LlmRubricScores } from '../types';
import { DISPARITY_CRITERIA, RUBRIC_DIMENSIONS } from '../constants';

// --- HELPER COMPONENTS ---

const DashboardCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-card text-card-foreground p-6 rounded-xl shadow-md border border-border ${className}`}>
        <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">{title}</h3>
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
    const size = 300;
    const center = size / 2;
    const numLevels = 5;
    const levelDistance = (center * 0.8) / numLevels;
    const numAxes = data.labels.length;

    const points = data.datasets.map(dataset => 
        dataset.values.map((value, i) => {
            const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
            const distance = (value / numLevels) * (center * 0.8);
            return `${center + distance * Math.cos(angle)},${center + distance * Math.sin(angle)}`;
        }).join(' ')
    );

    return (
        <div className="flex flex-col items-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Levels and Axes */}
                {[...Array(numLevels)].map((_, level) => (
                    <circle key={level} cx={center} cy={center} r={levelDistance * (level + 1)} fill="none" stroke="var(--color-border)" strokeWidth="1" />
                ))}
                {data.labels.map((_, i) => {
                    const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
                    return <line key={i} x1={center} y1={center} x2={center + (center * 0.8) * Math.cos(angle)} y2={center + (center * 0.8) * Math.sin(angle)} stroke="var(--color-border)" />;
                })}
                {/* Data Polygons */}
                {points.map((p, i) => (
                     <polygon key={i} points={p} fill={data.datasets[i].color} fillOpacity="0.3" stroke={data.datasets[i].color} strokeWidth="2" />
                ))}
                {/* Labels */}
                {data.labels.map((label, i) => {
                    const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
                    const x = center + (center * 0.95) * Math.cos(angle);
                    const y = center + (center * 0.95) * Math.sin(angle);
                    return (
                        <text key={label} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="10" className="fill-muted-foreground cursor-pointer hover:fill-primary hover:font-bold" onClick={() => onLabelClick(label, i)}>
                           {label}
                        </text>
                    )
                })}
            </svg>
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
    data: { label: string, yes: number, no: number, unsure: number, total: number }[];
    onBarClick: (label: string, category: 'yes' | 'no' | 'unsure') => void;
}> = ({ data, onBarClick }) => (
    <div className="space-y-4 text-sm">
        {data.map(d => {
            const yesPercent = d.total > 0 ? (d.yes / d.total) * 100 : 0;
            const noPercent = d.total > 0 ? (d.no / d.total) * 100 : 0;
            const unsurePercent = 100 - yesPercent - noPercent;
            return (
                <div key={d.label}>
                    <p className="font-medium text-foreground mb-1">{d.label}</p>
                    <div className="w-full flex h-5 rounded-md overflow-hidden bg-muted">
                        <button className="bg-destructive hover:opacity-80 transition-opacity" style={{ width: `${yesPercent}%` }} title={`Yes: ${d.yes}`} onClick={() => onBarClick(d.label, 'yes')}></button>
                        <button className="bg-green-500 hover:opacity-80 transition-opacity" style={{ width: `${noPercent}%` }} title={`No: ${d.no}`} onClick={() => onBarClick(d.label, 'no')}></button>
                        <button className="bg-gray-400 hover:opacity-80 transition-opacity" style={{ width: `${unsurePercent}%` }} title={`Unsure: ${d.unsure}`} onClick={() => onBarClick(d.label, 'unsure')}></button>
                    </div>
                    <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                        <span>{d.yes} Yes</span>
                        <span>{d.no} No</span>
                        <span>{d.unsure} Unsure</span>
                    </div>
                </div>
            )
        })}
    </div>
);


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

// --- MAIN COMPONENT ---

interface ReasoningDashboardProps {
    evaluations: ReasoningEvaluationRecord[];
}

const ReasoningDashboard: React.FC<ReasoningDashboardProps> = ({ evaluations }) => {
    const [drilldownData, setDrilldownData] = useState<{ title: string; evaluations: ReasoningEvaluationRecord[] } | null>(null);
    
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
        if (evaluations.length === 0) return null;
        const totalEvals = evaluations.length;
        const withReasoningA = evaluations.filter(e => e.reasoningRequestedA);
        const withReasoningB = evaluations.filter(e => e.reasoningRequestedB);
        
        return {
            totalEvaluations: totalEvals,
            uniqueScenarios: new Set(evaluations.map(e => e.scenarioId)).size,
            modelsTested: new Set(evaluations.map(e => e.model)).size,
            avgTimeA: evaluations.reduce((acc, curr) => acc + (curr.generationTimeSecondsA ?? 0), 0) / totalEvals,
            avgTimeB: evaluations.reduce((acc, curr) => acc + (curr.generationTimeSecondsB ?? 0), 0) / totalEvals,
            avgWordsA: evaluations.reduce((acc, curr) => acc + curr.answerWordCountA, 0) / totalEvals,
            avgWordsB: evaluations.reduce((acc, curr) => acc + curr.answerWordCountB, 0) / totalEvals,
            avgReasoningWordsA: withReasoningA.length > 0 ? withReasoningA.reduce((acc, curr) => acc + curr.reasoningWordCountA, 0) / withReasoningA.length : 0,
            avgReasoningWordsB: withReasoningB.length > 0 ? withReasoningB.reduce((acc, curr) => acc + curr.reasoningWordCountB, 0) / withReasoningB.length : 0,
            avgWordsPerSecondA: evaluations.reduce((acc, curr) => acc + (curr.wordsPerSecondA ?? 0), 0) / totalEvals,
            avgWordsPerSecondB: evaluations.reduce((acc, curr) => acc + (curr.wordsPerSecondB ?? 0), 0) / totalEvals,
        };
    }, [evaluations]);


    const radarChartData = useMemo(() => {
        if (evaluations.length === 0) return null;
        const dimensions = ['actionability_practicality', 'factuality', 'safety_security_privacy', 'tone_dignity_empathy', 'non_discrimination_fairness', 'freedom_of_access_censorship'] as const;
        const labels = ['Action', 'Fact', 'Safety', 'Tone', 'Fairness', 'Freedom'];
        
        const sumA = dimensions.map(() => 0);
        const sumB = dimensions.map(() => 0);

        evaluations.forEach(ev => {
            if (ev.humanScores?.english && ev.humanScores?.native) {
                dimensions.forEach((dim, i) => {
                    sumA[i] += getNumericScore(dim, ev.humanScores.english);
                    sumB[i] += getNumericScore(dim, ev.humanScores.native);
                });
            }
        });

        return {
            labels,
            dimensions,
            datasets: [
                { label: 'Response A', color: '#0284c7', values: sumA.map(v => v / evaluations.length) }, // sky-600
                { label: 'Response B', color: '#14b8a6', values: sumB.map(v => v / evaluations.length) }, // teal-500
            ]
        };
    }, [evaluations, getNumericScore]);

    const disparityChartData = useMemo(() => {
        if (evaluations.length === 0) return null;
        return DISPARITY_CRITERIA.map(crit => {
            const counts = { yes: 0, no: 0, unsure: 0 };
            evaluations.forEach(ev => {
                const value = ev.humanScores.disparity[crit.key as keyof typeof ev.humanScores.disparity];
                if (value === 'yes') counts.yes++; else if (value === 'no') counts.no++; else counts.unsure++;
            });
            return { ...crit, ...counts, total: evaluations.length };
        });
    }, [evaluations]);
    
    const agreementMetrics = useMemo(() => {
        const completedEvals = evaluations.filter(e => 
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
            return { label: dim.label, agreement: (agreements / (completedEvals.length * 2)) * 100 };
        });
        
        const disparityAgreementData = DISPARITY_CRITERIA.map(crit => {
            let agreements = 0;
            completedEvals.forEach(ev => {
                const humanVal = ev.humanScores.disparity[crit.key as keyof typeof ev.humanScores.disparity];
                const llmVal = ev.llmScores!.disparity[crit.key as keyof typeof ev.llmScores.disparity];
                if (humanVal === llmVal) agreements++;
            });
            return { label: crit.label, agreement: (agreements / completedEvals.length) * 100 };
        });

        return {
            singleResponse: agreementData,
            disparity: disparityAgreementData,
            evalCount: completedEvals.length
        };
    }, [evaluations, getNumericScore]);


    const handleDisparityBarClick = (label: string, category: 'yes' | 'no' | 'unsure') => {
        const crit = DISPARITY_CRITERIA.find(c => c.label === label);
        if (!crit) return;
        const filteredEvals = evaluations.filter(ev => ev.humanScores.disparity[crit.key as keyof typeof ev.humanScores.disparity] === category);
        setDrilldownData({ title: `Disparity: "${label}" is "${category}"`, evaluations: filteredEvals });
    };

    const handleRadarLabelClick = (label: string, index: number) => {
        if (!radarChartData) return;
        const dimensionKey = radarChartData.dimensions[index];
        const dimensionLabel = RUBRIC_DIMENSIONS.find(d => d.key === dimensionKey)?.label || label;
        const lowScoringEvals = evaluations.filter(ev => {
            const scoreA = getNumericScore(dimensionKey, ev.humanScores.english);
            const scoreB = getNumericScore(dimensionKey, ev.humanScores.native);
            return scoreA < 3 || scoreB < 3;
        });
        setDrilldownData({ title: `Low Scores (< 3) for "${dimensionLabel}"`, evaluations: lowScoringEvals });
    };


    if (!metrics || !radarChartData || !disparityChartData) {
        return <div className="text-center py-10 bg-card border border-border rounded-xl shadow-sm"><p className="text-lg text-muted-foreground">Not enough data to generate a dashboard. Complete at least one evaluation.</p></div>;
    }

    return (
        <div className="space-y-8">
            {drilldownData && <DrilldownModal data={drilldownData} onClose={() => setDrilldownData(null)} />}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Total Evaluations" value={metrics.totalEvaluations} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM5.404 15.657a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 101.06 1.06l1.06-1.06zM15.657 14.596a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM4.343 5.404a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.06 1.06l1.06 1.06z"/></svg>} />
                <StatCard label="Unique Scenarios" value={metrics.uniqueScenarios} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>} />
                <StatCard label="Models Tested" value={metrics.modelsTested} icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M11.624 3.322a4.5 4.5 0 10-7.248 5.044l-2.008 5.02a.75.75 0 00.933 1.054l5.02-2.008a4.5 4.5 0 103.303-9.11zM13 4.5a3 3 0 11-6 0 3 3 0 016 0z" clipRule="evenodd" /></svg>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <DashboardCard title="Average Performance (Human Scores)">
                     <div className="flex justify-end items-center gap-4 text-xs mb-4">
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-600 dark:bg-sky-500"></span><span>Response A</span></div>
                        <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-teal-500 dark:bg-teal-400"></span><span>Response B</span></div>
                    </div>
                    <BarChart data={[
                        { label: 'Generation Time', valueA: metrics.avgTimeA, valueB: metrics.avgTimeB, unit: 's' },
                        { label: 'Answer Words', valueA: metrics.avgWordsA, valueB: metrics.avgWordsB, unit: '' },
                        { label: 'Words/Second', valueA: metrics.avgWordsPerSecondA, valueB: metrics.avgWordsPerSecondB, unit: '' },
                        { label: 'Reasoning Words', valueA: metrics.avgReasoningWordsA, valueB: metrics.avgReasoningWordsB, unit: '' },
                    ]} />
                </DashboardCard>
                <DashboardCard title="Harm Assessment Scores (Human Scores)">
                    <p className="text-xs text-muted-foreground -mt-3 mb-3 text-center">Click a label to see low-scoring evaluations for that dimension.</p>
                    <RadarChart data={radarChartData} onLabelClick={handleRadarLabelClick}/>
                </DashboardCard>
            </div>
            
            <DashboardCard title="Disparity Analysis (Human Scores)">
                 <p className="text-xs text-muted-foreground -mt-3 mb-3">Click a bar segment to see the evaluations in that category.</p>
                <StackedBarChart data={disparityChartData} onBarClick={handleDisparityBarClick} />
            </DashboardCard>

            {agreementMetrics && (
                 <DashboardCard title="Human vs. LLM Agreement">
                    <p className="text-xs text-muted-foreground -mt-3 mb-3">Agreement rate based on {agreementMetrics.evalCount} evaluation(s) with completed LLM analysis. Slider agreement is defined as scores within +/- 1 point.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
        </div>
    );
};

export default ReasoningDashboard;
