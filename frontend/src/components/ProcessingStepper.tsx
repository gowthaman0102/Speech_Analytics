import React from 'react';
import { Check, Loader2 } from 'lucide-react';

interface Stage {
  key: string;
  label: string;
  description: string;
}

const STAGES: Stage[] = [
  { key: 'prepare', label: 'Preparing your audio', description: 'Converting audio format' },
  { key: 'listen', label: 'Listening to the speech', description: 'Generating the transcript' },
  { key: 'measure', label: 'Measuring delivery', description: 'Pitch, energy, and rhythm' },
  { key: 'find', label: 'Finding flagged moments', description: 'Checking where delivery differs' },
  { key: 'score', label: 'Scoring', description: 'Putting it all together' },
];

interface ProcessingStepperProps {
  progress: number;
  currentStep?: string | null;
  status: string;
}

export const ProcessingStepper: React.FC<ProcessingStepperProps> = ({
  progress,
  status,
}) => {
  const getStageIndex = (pct: number) => {
    if (pct < 25) return 0;
    if (pct < 50) return 1;
    if (pct < 75) return 2;
    if (pct < 90) return 3;
    return 4;
  };

  const activeIndex = status === 'COMPLETED' ? STAGES.length : getStageIndex(progress);

  return (
    <div className="space-y-2.5" role="list" aria-label="Processing stages">
      {STAGES.map((stage, idx) => {
        const isDone = status === 'COMPLETED' || idx < activeIndex;
        const isCurrent = status === 'PROCESSING' && idx === activeIndex;

        return (
          <div
            key={stage.key}
            className={`flex items-start gap-3.5 p-3.5 rounded-xl border text-sm transition-all ${
              isCurrent
                ? 'bg-surface-2 border-border-strong text-text font-medium shadow-2xs'
                : isDone
                ? 'bg-surface border-border text-text'
                : 'bg-transparent border-transparent text-text-muted opacity-50'
            }`}
            role="listitem"
            aria-current={isCurrent ? 'step' : undefined}
          >
            <div className="mt-0.5 shrink-0">
              {isDone ? (
                <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
                </div>
              ) : isCurrent ? (
                <div className="w-6 h-6 rounded-full border-2 border-accent flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" aria-hidden="true" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-xs font-semibold text-text-muted">
                  {idx + 1}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 text-left">
              <div className="font-bold text-text">
                {stage.label}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {stage.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
