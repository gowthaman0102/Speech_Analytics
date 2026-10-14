import React from 'react';
import { Card } from './ui/Card';
import type { RubricScoreItem } from '../types';

interface RubricCardProps {
  rubricDetails: RubricScoreItem[];
}

export const RubricCard: React.FC<RubricCardProps> = ({ rubricDetails }) => {
  const getBarColor = (score: number) => {
    if (score >= 85) return 'bg-[#1F4E79]';
    if (score >= 70) return 'bg-[#2E6B9E]';
    if (score >= 55) return 'bg-[#B45309]';
    return 'bg-[#C2571A]';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) return 'text-emerald-800 bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-sky-800 bg-sky-50 border-sky-200';
    if (score >= 55) return 'text-amber-800 bg-amber-50 border-amber-200';
    return 'text-rose-800 bg-rose-50 border-rose-200';
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-[var(--border)]">
        <div>
          <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
            Rubric Dimension Breakdown
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Deterministic scores computed across 6 acoustic signal dimensions relative to reference.
          </p>
        </div>
        <span className="text-xs font-mono text-[var(--muted-foreground)] bg-[var(--surface-2)] px-2.5 py-1 rounded border border-[var(--border)] shrink-0 self-start sm:self-auto">
          Scale: 0–100 pts
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rubricDetails.map((item) => {
          const score = Math.round(item.score);
          const barColor = getBarColor(score);
          const badgeClass = getScoreBadge(score);

          return (
            <div
              key={item.category}
              className="p-4 rounded-md border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between hover:border-[var(--border-strong)] transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm text-[var(--foreground)] leading-snug">
                    {item.category}
                  </h4>
                  <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border shrink-0 ${badgeClass}`}>
                    {score}
                    <span className="text-[10px] opacity-75">/100</span>
                  </span>
                </div>

                {/* Progress track */}
                <div className="w-full h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden my-2.5">
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

                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed mt-1">
                  {item.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                <span>Weight</span>
                <span className="font-mono font-medium text-[var(--foreground)]">
                  {Math.round(item.weight * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
