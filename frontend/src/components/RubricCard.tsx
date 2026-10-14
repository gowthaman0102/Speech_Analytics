import React from 'react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import type { RubricScoreItem } from '../types';

interface RubricCardProps {
  rubricDetails: RubricScoreItem[];
}

export const RubricCard: React.FC<RubricCardProps> = ({ rubricDetails }) => {
  const getBarColor = (score: number) => {
    if (score >= 85) return 'bg-success';
    if (score >= 70) return 'bg-teal';
    if (score >= 55) return 'bg-warning';
    return 'bg-accent';
  };

  const getScoreBadgeVariant = (score: number): 'success' | 'teal' | 'warning' | 'danger' => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'teal';
    if (score >= 55) return 'warning';
    return 'danger';
  };

  return (
    <Card className="p-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-border">
        <div>
          <h3 className="text-base font-bold text-text tracking-tight">
            Rubric score breakdown
          </h3>
          <p className="text-xs text-text-muted mt-1">
            Scores evaluated across core delivery dimensions.
          </p>
        </div>
        <Badge variant="neutral" size="sm">
          Scale: 0–100 pts
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rubricDetails.map((item) => {
          const score = Math.round(item.score);
          const barColor = getBarColor(score);
          const badgeVariant = getScoreBadgeVariant(score);
          const weightPct = `${Math.round(item.weight * 100)}%`;

          return (
            <div
              key={item.category}
              className="p-5 rounded-xl border border-border bg-surface flex flex-col justify-between hover:border-border-strong transition-all shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-bold text-sm text-text leading-snug">
                    {item.category}
                  </h4>
                  <Badge variant={badgeVariant} size="sm">
                    <span>{score}</span>
                    <span className="text-xs opacity-75 ml-1">/ 100</span>
                  </Badge>
                </div>

                {/* Progress track */}
                <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden my-3 border border-border">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                    style={{ width: `${score}%` }}
                    role="progressbar"
                    aria-valuenow={score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${item.category} score`}
                  />
                </div>

                <p className="text-xs text-text-muted leading-relaxed mt-1">
                  {item.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                <span className="font-medium">Category weight</span>
                <span className="font-bold text-text tabular-nums">
                  {weightPct}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
