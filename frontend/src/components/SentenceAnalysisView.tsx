import React, { useState } from 'react';
import { Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import type { SentenceAnalysisItem } from '../types';

interface SentenceAnalysisViewProps {
  sentences: SentenceAnalysisItem[];
  onSeekTime: (timestamp: number) => void;
  activeTime?: number | null;
}

const getIntentBadgeVariant = (intent: string): 'danger' | 'accent' | 'teal' | 'warning' | 'default' => {
  const i = intent.toLowerCase();
  if (i.includes('urgent') || i.includes('call_to_action') || i.includes('action')) {
    return 'danger';
  }
  if (i.includes('persuasive') || i.includes('important')) {
    return 'accent';
  }
  if (i.includes('motivational') || i.includes('emotional')) {
    return 'teal';
  }
  if (i.includes('serious') || i.includes('reflective') || i.includes('conclusion') || i.includes('question')) {
    return 'warning';
  }
  return 'default';
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
    <Card className="p-6 space-y-5 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-text tracking-tight">
              Sentence-by-sentence delivery alignment
            </h3>
            <Badge variant="teal" size="sm">
              {sentences.length} sentences
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Expected delivery for each thought group compared against actual vocal performance.
          </p>
        </div>
        <span className="text-xs text-text-muted">
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

          const badgeVariant = getIntentBadgeVariant(item.primary_intent);
          const score = Math.round(item.compatibility_score);
          const scoreBadgeVariant = score >= 80 ? 'success' : score >= 65 ? 'warning' : 'danger';

          const exp = item.expected_delivery;
          const act = item.actual_prosody;

          return (
            <div
              key={item.sentence_index || idx}
              onClick={() => {
                setSelectedIdx(idx);
                onSeekTime(item.start_time);
              }}
              className={`p-5 rounded-xl border transition-all cursor-pointer text-left ${
                isSelected || isCurrentInPlayback
                  ? 'bg-surface-2 border-accent shadow-xs ring-2 ring-accent/30'
                  : 'bg-surface border-border hover:border-border-strong'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left: Timing & Intent Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-surface-2 text-text border border-border tabular-nums">
                    Sentence {item.sentence_index ?? idx + 1} • {(item.start_time ?? 0).toFixed(1)}s – {(item.end_time ?? 0).toFixed(1)}s
                  </span>
                  <Badge variant={badgeVariant} size="sm">
                    {item.primary_intent.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-surface text-text-muted border border-border">
                    Role: {item.role}
                  </span>
                </div>

                {/* Right: Compatibility Score Badge */}
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <Badge variant={scoreBadgeVariant} size="sm">
                    {score >= 70 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 inline" />
                    )}
                    <span>{score}% match</span>
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="p-1 h-7 w-7 text-text-muted hover:text-accent"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSeekTime(item.start_time ?? 0);
                    }}
                    title="Play sentence audio"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Spoken Text */}
              <div className="mt-3">
                <p className="text-sm font-medium text-text leading-relaxed">
                  "{item.text}"
                </p>
              </div>

              {/* Acoustic Evidence Grid */}
              <div className="mt-3.5 pt-3.5 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {/* Cadence / WPM */}
                <div className="p-2.5 rounded-xl bg-surface-2 border border-border">
                  <span className="text-xs text-text-muted block">Speaking rate</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-bold text-text tabular-nums">
                      {act?.speech_rate_wpm ? `${act.speech_rate_wpm} WPM` : '—'}
                    </span>
                    <span className="text-xs text-text-muted tabular-nums">
                      {exp?.pace_wpm ? `Target: ${exp.pace_wpm.ideal}` : ''}
                    </span>
                  </div>
                </div>

                {/* Pitch Modulation */}
                <div className="p-2.5 rounded-xl bg-surface-2 border border-border">
                  <span className="text-xs text-text-muted block">Pitch modulation</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-bold text-text tabular-nums">
                      {typeof act?.pitch_variation === 'number' ? act.pitch_variation.toFixed(3) : '—'}
                    </span>
                    <span className="text-xs text-text-muted tabular-nums">
                      {typeof exp?.pitch_variation?.ideal === 'number' ? `Target: ${exp.pitch_variation.ideal.toFixed(2)}` : ''}
                    </span>
                  </div>
                </div>

                {/* Energy Projection */}
                <div className="p-2.5 rounded-xl bg-surface-2 border border-border">
                  <span className="text-xs text-text-muted block">Vocal energy</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-bold text-text tabular-nums">
                      {typeof act?.normalized_energy === 'number' ? act.normalized_energy.toFixed(2) : '—'}
                    </span>
                    <span className="text-xs text-text-muted tabular-nums">
                      {typeof exp?.energy?.ideal === 'number' ? `Target: ${exp.energy.ideal.toFixed(2)}` : ''}
                    </span>
                  </div>
                </div>

                {/* Expected Tone Intonation */}
                <div className="p-2.5 rounded-xl bg-surface-2 border border-border">
                  <span className="text-xs text-text-muted block">Intonation</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-bold text-text">
                      {exp?.intonation || 'Modulated'}
                    </span>
                    {typeof act?.final_pitch_delta_hz === 'number' && (
                      <span className="text-xs text-text-muted tabular-nums">
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
