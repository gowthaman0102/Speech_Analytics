import React from 'react';
import { Badge } from './ui/Badge';

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
  let badgeVariant: 'success' | 'teal' | 'warning' | 'danger' = 'danger';
  let strokeColor = '#A23A26'; // --danger

  if (clampedScore >= 85) {
    statusText = 'Excellent';
    badgeVariant = 'success';
    strokeColor = '#2F6B4F'; // --success
  } else if (clampedScore >= 70) {
    statusText = 'Competent';
    badgeVariant = 'teal';
    strokeColor = '#2F6F73'; // --teal
  } else if (clampedScore >= 55) {
    statusText = 'Developing';
    badgeVariant = 'warning';
    strokeColor = '#8A6410'; // --warning
  }

  const dimensions = {
    sm: { radius: 28, stroke: 4, box: 72, fontSize: 'text-xl', labelSize: 'text-xs' },
    md: { radius: 44, stroke: 6, box: 110, fontSize: 'text-3xl', labelSize: 'text-sm' },
    lg: { radius: 64, stroke: 8, box: 156, fontSize: 'text-4xl', labelSize: 'text-base' },
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
            stroke="#F5E8DA"
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
          <span className={`font-extrabold text-text tracking-tight ${dimensions.fontSize}`}>
            {clampedScore}
          </span>
          {size === 'lg' && (
            <span className="text-xs text-text-muted font-bold">
              / 100
            </span>
          )}
        </div>
      </div>

      <div className="mt-2.5">
        <h4 className={`font-bold text-text ${dimensions.labelSize}`}>{label}</h4>
        {weight !== undefined && (
          <span className="text-xs text-text-muted block">
            Weight: {Math.round(weight * 100)}%
          </span>
        )}
        {showCategoryBadge && (
          <div className="mt-2">
            <Badge variant={badgeVariant} size="sm">
              {statusText}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};
