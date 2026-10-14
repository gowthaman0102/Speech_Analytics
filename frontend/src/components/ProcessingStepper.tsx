import React from 'react';
import { Check, Loader2 } from 'lucide-react';

interface Stage {
  key: string;
  label: string;
  description: string;
}

const STAGES: Stage[] = [
  { key: 'media', label: '1. Media Preprocessing & Extraction', description: 'Transcoding input video/audio to 16 kHz Mono PCM WAV' },
  { key: 'asr', label: '2. Automatic Speech Recognition', description: 'Faster-Whisper transcribing speech and word-level timestamps' },
  { key: 'segment', label: '3. Sentence & Phrase Segmentation', description: 'Partitioning speech into rhetorical sentences and pause bounds' },
  { key: 'semantic', label: '4. Semantic Intent & Expectations', description: 'Dense embeddings modeling communicative intent and delivery profiles' },
  { key: 'prosody', label: '5. Prosody & Speaker Baseline', description: 'Extracting continuous F0 pitch, RMS energy, and z-score normalization' },
  { key: 'flaws', label: '6. Temporal Flaw Detection', description: 'Grounding mismatches, monotone delivery, and rhetorical pacing' },
  { key: 'scoring', label: '7. Rubric Scoring & Takeaways', description: 'Deterministic 6-dimension scoring and actionable recommendations' },
];

interface ProcessingStepperProps {
  progress: number;
  currentStep?: string | null;
  status: string;
}

export const ProcessingStepper: React.FC<ProcessingStepperProps> = ({
  progress,
  currentStep,
  status,
}) => {
  // Map progress to active stage index
  const getStageIndex = (pct: number) => {
    if (pct < 20) return 0;
    if (pct < 35) return 1;
    if (pct < 50) return 2;
    if (pct < 65) return 3;
    if (pct < 78) return 4;
    if (pct < 88) return 5;
    return 6;
  };

  const activeIndex = status === 'COMPLETED' ? STAGES.length : getStageIndex(progress);

  return (
    <div className="space-y-3" role="list" aria-label="Processing stages">
      {STAGES.map((stage, idx) => {
        const isDone = status === 'COMPLETED' || idx < activeIndex;
        const isCurrent = status === 'PROCESSING' && idx === activeIndex;
        const isPending = !isDone && !isCurrent;

        return (
          <div
            key={stage.key}
            className={`flex items-start gap-3.5 p-3 rounded-md border text-sm transition-colors ${
              isCurrent
                ? 'bg-[var(--surface-2)] border-[var(--border-strong)] text-[var(--foreground)]'
                : isDone
                ? 'bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)]'
                : 'bg-transparent border-transparent text-[var(--muted-foreground)] opacity-60'
            }`}
            role="listitem"
            aria-current={isCurrent ? 'step' : undefined}
          >
            <div className="mt-0.5 shrink-0">
              {isDone ? (
                <div className="w-5 h-5 rounded-full bg-[var(--accent)] text-white flex items-center justify-center">
                  <Check className="w-3.5 h-3.5" aria-hidden="true" />
                </div>
              ) : isCurrent ? (
                <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" aria-hidden="true" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-[var(--border)] flex items-center justify-center text-xs font-mono text-[var(--muted-foreground)]">
                  {idx + 1}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`font-medium ${isCurrent ? 'text-[var(--foreground)]' : ''}`}>
                  {stage.label}
                </span>
                {isCurrent && currentStep && (
                  <span className="text-xs font-mono text-[var(--muted-foreground)] truncate max-w-[200px]">
                    {currentStep}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {stage.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
