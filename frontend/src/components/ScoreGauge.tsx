import React from 'react';

interface ScoreGaugeProps {
  score: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  weight?: number;
  showCategoryBadge?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  label,
  size = 'md',
  weight,
  showCategoryBadge = true,
}) => {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  let color = '#f43f5e'; // <55 Significant Improvement
  let statusText = 'Needs Work';
  let badgeBg = 'bg-rose-500/15 text-rose-400 border-rose-500/30';

  if (clampedScore >= 85) {
    color = '#10b981'; // 85-100 Excellent
    statusText = 'Excellent';
    badgeBg = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  } else if (clampedScore >= 70) {
    color = '#06b6d4'; // 70-84 Good
    statusText = 'Good';
    badgeBg = 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
  } else if (clampedScore >= 55) {
    color = '#f59e0b'; // 55-69 Needs Improvement
    statusText = 'Moderate';
    badgeBg = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  }

  const dimensions = {
    sm: { radius: 32, stroke: 5, box: 80, fontSize: 'text-lg', labelSize: 'text-xs' },
    md: { radius: 48, stroke: 7, box: 120, fontSize: 'text-2xl', labelSize: 'text-sm' },
    lg: { radius: 76, stroke: 10, box: 180, fontSize: 'text-4xl', labelSize: 'text-base' },
  }[size];

  const circumference = 2 * Math.PI * dimensions.radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-3">
      <div className="relative flex items-center justify-center" style={{ width: dimensions.box, height: dimensions.box }}>
        <svg className="transform -rotate-90" width={dimensions.box} height={dimensions.box}>
          {/* Background circle */}
          <circle
            cx={dimensions.box / 2}
            cy={dimensions.box / 2}
            r={dimensions.radius}
            stroke="#1e293b"
            strokeWidth={dimensions.stroke}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={dimensions.box / 2}
            cy={dimensions.box / 2}
            r={dimensions.radius}
            stroke={color}
            strokeWidth={dimensions.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className={`font-black tracking-tight text-white ${dimensions.fontSize}`}>
            {clampedScore}
          </span>
          {size === 'lg' && <span className="text-[11px] text-slate-400 font-semibold uppercase">out of 100</span>}
        </div>
      </div>

      <div className="mt-2 text-center">
        <h4 className={`font-semibold text-slate-200 ${dimensions.labelSize}`}>{label}</h4>
        {weight !== undefined && (
          <span className="text-[11px] text-slate-500">Weight: {Math.round(weight * 100)}%</span>
        )}
        {showCategoryBadge && (
          <div className="mt-1">
            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeBg}`}>
              {statusText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
