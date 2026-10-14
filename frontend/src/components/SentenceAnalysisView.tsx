import React, { useState } from 'react';
import { Play, Volume2, CheckCircle2, AlertTriangle, HelpCircle, ChevronRight, MessageSquareQuote } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import type { SentenceAnalysisItem } from '../types';

interface SentenceAnalysisViewProps {
  sentences: SentenceAnalysisItem[];
  onSeekTime: (timestamp: number) => void;
  activeTime?: number | null;
}

const getIntentBadge = (intent: string) => {
  const i = intent.toLowerCase();
  if (i.includes('urgent') || i.includes('call_to_action') || i.includes('action')) {
    return {
      label: intent.replace(/_/g, ' '),
      className: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50',
    };
  }
  if (i.includes('question')) {
    return {
      label: 'Question',
      className: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50',
    };
  }
  if (i.includes('persuasive') || i.includes('important')) {
    return {
      label: intent.replace(/_/g, ' '),
      className: 'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/50',
    };
  }
  if (i.includes('motivational') || i.includes('emotional')) {
    return {
      label: intent.replace(/_/g, ' '),
      className: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
    };
  }
  if (i.includes('serious') || i.includes('reflective') || i.includes('conclusion')) {
    return {
      label: intent.replace(/_/g, ' '),
      className: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50',
    };
  }
  return {
    label: intent.replace(/_/g, ' '),
    className: 'bg-[var(--surface-2)] text-[var(--muted-foreground)] border-[var(--border)]',
  };
};

export const SentenceAnalysisView: React.FC<SentenceAnalysisViewProps> = ({
  sentences,
  onSeekTime,
  activeTime,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!sentences || sentences.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
              Sentence-Level Semantic Tone Alignment
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--muted-foreground)] border border-[var(--border)]">
              {sentences.length} Sentences
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Automatic intent inference paired with recommended prosodic ranges vs observed delivery.
          </p>
        </div>
        <span className="text-xs text-[var(--muted-foreground)] font-mono">
          Click any sentence to seek audio playback
        </span>
      </div>

      {/* Sentence Cards List */}
      <div className="space-y-3">
        {sentences.map((item, idx) => {
          const isSelected = selectedIdx === idx;
          const isCurrentInPlayback =
            activeTime !== undefined &&
            activeTime !== null &&
            activeTime >= item.start_time &&
            activeTime <= item.end_time;

          const badge = getIntentBadge(item.primary_intent);
          const score = Math.round(item.compatibility_score);
          const scoreColor =
            score >= 80
              ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-300 dark:bg-emerald-950/40'
              : score >= 65
              ? 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/40'
              : 'text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-300 dark:bg-rose-950/40';

          const exp = item.expected_delivery;
          const act = item.actual_prosody;

          return (
            <div
              key={item.sentence_index || idx}
              onClick={() => {
                setSelectedIdx(idx);
                onSeekTime(item.start_time);
              }}
              className={`p-4 rounded-lg border transition-all cursor-pointer text-left ${
                isSelected || isCurrentInPlayback
                  ? 'bg-[var(--surface-2)] border-[var(--accent)] ring-1 ring-[var(--accent)]'
                  : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left: Timing & Intent Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border)]">
                    #{idx + 1} • {item.start_time.toFixed(1)}s – {item.end_time.toFixed(1)}s
                  </span>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded border capitalize ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] text-[var(--muted-foreground)] border border-[var(--border)] capitalize">
                    Role: {item.role}
                  </span>
                </div>

                {/* Right: Compatibility Score Badge */}
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <span
                    className={`text-xs font-mono font-semibold px-2.5 py-0.5 rounded border flex items-center gap-1 ${scoreColor}`}
                  >
                    {score >= 70 ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    <span>{score}% Compatibility</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-1 h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--accent)]"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeekTime(item.start_time);
                    }}
                    title="Play sentence audio"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Spoken Text */}
              <div className="mt-2.5">
                <p className="text-sm font-serif text-[var(--foreground)] leading-relaxed">
                  "{item.text}"
                </p>
              </div>

              {/* Acoustic Evidence Grid */}
              <div className="mt-3 pt-3 border-t border-[var(--border)] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                {/* Cadence / WPM */}
                <div className="p-2 rounded bg-[var(--surface-2)] border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--muted-foreground)] block">Speaking Rate</span>
                  <div className="mt-0.5 flex items-baseline justify-between">
                    <span className="font-semibold text-[var(--foreground)]">
                      {act?.speech_rate_wpm ? `${act.speech_rate_wpm} WPM` : '—'}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      {exp?.pace_wpm ? `Target: ${exp.pace_wpm.ideal}` : ''}
                    </span>
                  </div>
                </div>

                {/* Pitch Modulation */}
                <div className="p-2 rounded bg-[var(--surface-2)] border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--muted-foreground)] block">Pitch Modulation</span>
                  <div className="mt-0.5 flex items-baseline justify-between">
                    <span className="font-semibold text-[var(--foreground)]">
                      {act?.pitch_variation ? act.pitch_variation.toFixed(3) : '—'}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      {exp?.pitch_variation ? `Target: ${exp.pitch_variation.ideal.toFixed(2)}` : ''}
                    </span>
                  </div>
                </div>

                {/* Energy Projection */}
                <div className="p-2 rounded bg-[var(--surface-2)] border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--muted-foreground)] block">Vocal Energy</span>
                  <div className="mt-0.5 flex items-baseline justify-between">
                    <span className="font-semibold text-[var(--foreground)]">
                      {act?.normalized_energy ? act.normalized_energy.toFixed(2) : '—'}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      {exp?.energy ? `Target: ${exp.energy.ideal.toFixed(2)}` : ''}
                    </span>
                  </div>
                </div>

                {/* Expected Tone Intonation */}
                <div className="p-2 rounded bg-[var(--surface-2)] border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--muted-foreground)] block">Intonation Contour</span>
                  <div className="mt-0.5 flex items-baseline justify-between">
                    <span className="font-semibold text-[var(--foreground)]">
                      {exp?.intonation || 'MODULATED'}
                    </span>
                    {act?.final_pitch_delta_hz !== undefined && (
                      <span className="text-[10px] text-[var(--muted-foreground)]">
                        {act.final_pitch_delta_hz >= 0 ? '+' : ''}
                        {act.final_pitch_delta_hz.toFixed(1)} Hz
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
