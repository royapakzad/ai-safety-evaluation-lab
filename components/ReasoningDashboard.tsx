
import React, { useState } from 'react';

// --- HELPER COMPONENTS ---

const DashboardCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode; className?: string; id?: string }> = ({ title, subtitle, children, className = '', id }) => (
    <div id={id} className={`bg-card text-card-foreground p-6 rounded-xl shadow-md border border-border ${className}`}>
        <div className="border-b border-border mb-4 pb-3">
             <h3 className="text-lg font-semibold text-foreground">{title}</h3>
             {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {children}
    </div>
);


const ScoreScatterPlot: React.FC<{
    points: { x: number; y: number; id: string; context: string }[];
    xLabel: string;
    yLabel:string;
    title: string;
    maxVal: number;
}> = ({ points, xLabel, yLabel, title, maxVal }) => {
    const [tooltip, setTooltip] = useState<{ x: number, y: number, text: string } | null>(null);
    const size = 350;
    const padding = 45;
    const plotSize = size - padding * 2;
    const safeMaxVal = Math.max(1, maxVal);

    const xScale = (val: number) => padding + (val / safeMaxVal) * plotSize;
    const yScale = (val: number) => padding + plotSize - (val / safeMaxVal) * plotSize;

    const generateTicks = (max: number): number[] => {
        if (max <= 1) { // For scales like 0-0.6 or 0-1
            const ticks = [];
            for (let i = 0; i <= max + 0.01; i += 0.2) {
                ticks.push(i);
            }
            return ticks;
        }
        if (max <= 12) { // For scales like 0-11
            return Array.from({ length: Math.ceil(max) + 1 }, (_, i) => i);
        }
        const interval = Math.ceil(max / 5);
        const ticks = [];
        for (let i = 0; i <= max; i += interval) {
            ticks.push(i);
        }
        return ticks;
    };
    const ticks = generateTicks(safeMaxVal);

    return (
        <div className="relative flex flex-col items-center">
            <h5 className="font-semibold text-foreground text-center mb-3 text-sm">{title}</h5>
            <svg width="100%" height="auto" viewBox={`0 0 ${size} ${size}`} className="font-sans">
                 <rect x={padding} y={padding} width={plotSize} height={plotSize} fill="var(--color-background)" />
                {/* Grid Lines */}
                {ticks.map((val, i) => {
                    const x = xScale(val);
                    const y = yScale(val);
                    return <g key={i} className="text-muted-foreground text-xs" fill="currentColor">
                        <line x1={x} y1={padding} x2={x} y2={size - padding} className="stroke-border" strokeDasharray="2" />
                        <line x1={padding} y1={y} x2={size - padding} y2={y} className="stroke-border" strokeDasharray="2" />
                        
                        <text x={x} y={size - padding + 15} textAnchor="middle">{val.toFixed(safeMaxVal <= 1 ? 1 : 0)}</text>
                        {val !== 0 && <text x={padding - 10} y={y} textAnchor="end" dominantBaseline="middle">{val.toFixed(safeMaxVal <= 1 ? 1 : 0)}</text>}
                    </g>
                })}
                <text x={padding} y={size - padding + 15} textAnchor="middle" fill="currentColor" className="text-muted-foreground text-xs">0</text>


                {/* Axes Lines */}
                <line x1={padding} y1={padding} x2={padding} y2={size - padding} className="stroke-foreground/50" />
                <line x1={padding} y1={size - padding} x2={size - padding} y2={size - padding} className="stroke-foreground/50" />
                
                {/* Diagonal Line of Perfect Agreement */}
                <line x1={padding} y1={size - padding} x2={size - padding} y2={padding} stroke="var(--color-destructive)" strokeWidth="1.5" strokeDasharray="4" />

                {/* Points */}
                {points.map(p => (
                    <g key={p.id}>
                        <circle 
                            cx={xScale(p.x)} 
                            cy={yScale(p.y)} 
                            r="5" 
                            className="fill-transparent stroke-primary stroke-2"
                        />
                         <circle // Invisible hover target for easier interaction
                            cx={xScale(p.x)}
                            cy={yScale(p.y)}
                            r="10" 
                            className="fill-transparent cursor-pointer"
                            onMouseEnter={() => setTooltip({ x: xScale(p.x), y: yScale(p.y) - 10, text: p.context })}
                            onMouseLeave={() => setTooltip(null)}
                        />
                    </g>
                ))}

                {/* Labels */}
                <text x={size / 2} y={size - 10} textAnchor="middle" className="text-xs text-muted-foreground" fill="currentColor">{xLabel}</text>
                <text x={15} y={size / 2} textAnchor="middle" className="text-xs text-muted-foreground" transform={`rotate(-90, 15, ${size/2})`} fill="currentColor">{yLabel}</text>
            </svg>
             {tooltip && (
                <div
                    className="absolute bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-[100] max-w-[200px]"
                    style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
                >
                    {tooltip.text}
                </div>
            )}
        </div>
    );
};


// Static data to represent the scores from an analysis report.
const staticCombinedScorePoints = [
  { x: 6.2, y: 7.3, id: 'p1', context: 'Scenario A' },
  { x: 5.8, y: 7.8, id: 'p2', context: 'Scenario B' },
  { x: 6.0, y: 9.0, id: 'p3', context: 'Scenario C' },
  { x: 6.1, y: 9.3, id: 'p4', context: 'Scenario D' },
  { x: 6.2, y: 9.5, id: 'p5', context: 'Scenario E' },
  { x: 6.3, y: 9.2, id: 'p6', context: 'Scenario F' },
  { x: 6.4, y: 10.5, id: 'p7', context: 'Scenario G' },
  { x: 6.5, y: 10.3, id: 'p8', context: 'Scenario H' },
  { x: 5.9, y: 9.1, id: 'p9', context: 'Scenario I' },
];

const staticDisparityScorePoints = [
  { x: 0.40, y: 0.35, id: 'd1', context: 'Scenario J' },
  { x: 0.42, y: 0.55, id: 'd2', context: 'Scenario K' },
  { x: 0.44, y: 0.51, id: 'd3', context: 'Scenario L' },
  { x: 0.45, y: 0.40, id: 'd4', context: 'Scenario M' },
  { x: 0.45, y: 0.38, id: 'd5', context: 'Scenario N' },
  { x: 0.46, y: 0.35, id: 'd6', context: 'Scenario O' },
  { x: 0.48, y: 0.45, id: 'd7', context: 'Scenario P' },
  { x: 0.50, y: 0.40, id: 'd8', context: 'Scenario Q' },
  { x: 0.55, y: 0.42, id: 'd9', context: 'Scenario R' },
  { x: 0.58, y: 0.25, id: 'd10', context: 'Scenario S' },
];


interface ReasoningDashboardProps {
    evaluations: any[]; // Prop is maintained for API consistency, but not used in this static version.
}

const ReasoningDashboard: React.FC<ReasoningDashboardProps> = ({ evaluations }) => {
    return (
        <DashboardCard 
            title="Human vs LLM Comparison"
            subtitle="A comparison of scores from a static analysis report. It plots human evaluator scores (X-axis) against LLM judge scores (Y-axis) for key contexts. Points on the red dashed line indicate perfect agreement."
        >
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ScoreScatterPlot 
                    points={staticCombinedScorePoints}
                    xLabel="Human Evaluator Scores"
                    yLabel="LLM Evaluator Scores"
                    title="Combined Quality Score Comparison"
                    maxVal={11}
                />
                <ScoreScatterPlot 
                    points={staticDisparityScorePoints}
                    xLabel="Human Evaluator Scores"
                    yLabel="LLM Evaluator Scores"
                    title="Disparity Score Comparison"
                    maxVal={0.6}
                />
            </div>
        </DashboardCard>
    );
};

export default ReasoningDashboard;
