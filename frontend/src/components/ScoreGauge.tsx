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

  let statusText = 'Needs Practice';
  let badgeClasses = 'bg-rose-50 text-rose-800 border-rose-200';
  let strokeColor = '#C2571A';

  if (clampedScore >= 85) {
    statusText = 'Excellent';
    badgeClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    strokeColor = '#1F4E79';
  } else if (clampedScore >= 70) {
    statusText = 'Competent';
    badgeClasses = 'bg-sky-50 text-sky-800 border-sky-200';
    strokeColor = '#1F4E79';
  } else if (clampedScore >= 55) {
    statusText = 'Developing';
    badgeClasses = 'bg-amber-50 text-amber-800 border-amber-200';
    strokeColor = '#B45309';
  }

  const dimensions = {
    sm: { radius: 28, stroke: 4, box: 72, fontSize: 'text-xl', labelSize: 'text-xs' },
    md: { radius: 44, stroke: 6, box: 110, fontSize: 'text-3xl', labelSize: 'text-sm' },
    lg: { radius: 64, stroke: 8, box: 156, fontSize: 'text-5xl', labelSize: 'text-base' },
  }[size];

  const circumference = 2 * Math.PI * dimensions.radius;
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2 text-center">
      <div
        className="relative flex items-center justify-center"
        style={{ width: dimensions.box, height: dimensions.box }}
      >
        <svg
          className="transform -rotate-90"
          width={dimensions.box}
          height={dimensions.box}
          aria-hidden="true"
        >
          {/* Background track */}
          <circle
            cx={dimensions.box / 2}
            cy={dimensions.box / 2}
            r={dimensions.radius}
            stroke="var(--surface-2)"
            strokeWidth={dimensions.stroke}
            fill="transparent"
          />
          {/* Active progress */}
          <circle
            cx={dimensions.box / 2}
            cy={dimensions.box / 2}
            r={dimensions.radius}
            stroke={strokeColor}
            strokeWidth={dimensions.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className={`font-serif font-bold text-[var(--foreground)] tracking-tight ${dimensions.fontSize}`}>
            {clampedScore}
          </span>
          {size === 'lg' && (
            <span className="text-[10px] text-[var(--muted-foreground)] font-mono uppercase tracking-wider">
              / 100
            </span>
          )}
        </div>
      </div>

      <div className="mt-2.5">
        <h4 className={`font-medium text-[var(--foreground)] ${dimensions.labelSize}`}>{label}</h4>
        {weight !== undefined && (
          <span className="text-xs text-[var(--muted-foreground)] block">
            Weight: {Math.round(weight * 100)}%
          </span>
        )}
        {showCategoryBadge && (
          <div className="mt-1.5">
            <span className={`inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${badgeClasses}`}>
              {statusText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
