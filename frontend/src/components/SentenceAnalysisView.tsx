import React, { useState } from 'react';
import { Play, Pause, CheckCircle2, AlertTriangle, Volume2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import type { SentenceAnalysisItem } from '../types';

interface SentenceAnalysisViewProps {
  sentences: SentenceAnalysisItem[];
  onPlaySentence?: (start: number, end?: number, sentenceIdx?: number) => void;
  onPause?: () => void;
  onSeekTime?: (timestamp: number) => void;
  currentTime?: number;
  isPlaying?: boolean;
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
  onPlaySentence,
  onPause,
  onSeekTime,
  currentTime,
  isPlaying = false,
  activeTime,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!sentences || sentences.length === 0) {
    return null;
  }

  const effectiveCurrentTime = currentTime !== undefined && currentTime !== null
    ? currentTime
    : (activeTime !== undefined && activeTime !== null ? activeTime : null);

  return (
    <Card className="p-6 space-y-5 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-text tracking-tight">
              Sentence-Level Semantic Tone Alignment
            </h3>
            <Badge variant="teal" size="sm">
              {sentences.length} Sentences
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Automatic intent inference paired with recommended prosodic ranges vs observed delivery.
          </p>
        </div>
        <span className="text-xs text-text-muted">
          Click any sentence or play icon to listen to that phrase
        </span>
      </div>

      {/* Sentence Cards List */}
      <div className="space-y-3">
        {sentences.map((item, idx) => {
          const isSelected = selectedIdx === idx;
          const isSentenceTimeMatched =
            effectiveCurrentTime !== null &&
            effectiveCurrentTime >= (item.start_time - 0.05) &&
            effectiveCurrentTime <= (item.end_time + 0.05);

          const isThisPlaying = isSentenceTimeMatched && isPlaying;

          const badgeVariant = getIntentBadgeVariant(item.primary_intent);
          const score = Math.round(item.compatibility_score);
          const scoreBadgeVariant = score >= 80 ? 'success' : score >= 65 ? 'warning' : 'danger';

          const exp = item.expected_delivery;
          const act = item.actual_prosody;

          const sStart = typeof item.start_time === 'number' ? item.start_time : 0;
          const sEnd = typeof item.end_time === 'number' && item.end_time > sStart
            ? item.end_time
            : (sStart + (item.duration || 3.0));

          const handlePlayClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            setSelectedIdx(idx);

            if (isThisPlaying) {
              if (onPause) {
                onPause();
              }
            } else {
              if (onPlaySentence) {
                onPlaySentence(sStart, sEnd, idx);
              } else if (onSeekTime) {
                onSeekTime(sStart);
              }
            }
          };

          const handleCardClick = () => {
            setSelectedIdx(idx);
            if (onPlaySentence) {
              onPlaySentence(sStart, sEnd, idx);
            } else if (onSeekTime) {
              onSeekTime(sStart);
            }
          };

          return (
            <div
              key={item.sentence_index || idx}
              onClick={handleCardClick}
              className={`p-5 rounded-xl border transition-all cursor-pointer text-left ${
                isThisPlaying
                  ? 'bg-surface-2 border-accent shadow-xs ring-2 ring-accent/30'
                  : isSelected
                  ? 'bg-surface-2 border-accent shadow-xs'
                  : 'bg-surface border-border hover:border-border-strong hover:bg-surface-2/40'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left: Timing & Intent Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-surface-2 text-text border border-border tabular-nums">
                    #{item.sentence_index ?? idx + 1} • {sStart.toFixed(1)}s – {sEnd.toFixed(1)}s
                  </span>
                  <Badge variant={badgeVariant} size="sm">
                    {item.primary_intent.replace(/_/g, ' ')}
                  </Badge>
                  <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-surface text-text-muted border border-border">
                    Role: {item.role}
                  </span>
                  {isThisPlaying && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent text-white text-xs font-bold shadow-2xs">
                      <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                      <span>Playing</span>
                    </span>
                  )}
                </div>

                {/* Right: Compatibility Score Badge & Dedicated Play Sentence Button */}
                <div className="flex items-center gap-2 self-start md:self-auto">
                  <Badge variant={scoreBadgeVariant} size="sm">
                    {score >= 70 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 mr-1 inline" />
                    )}
                    <span>{score}% Compatibility</span>
                  </Badge>

                  <button
                    type="button"
                    onClick={handlePlayClick}
                    className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer shrink-0 font-bold text-xs ${
                      isThisPlaying
                        ? 'bg-accent text-white border-accent shadow-xs scale-102 ring-2 ring-accent/30'
                        : 'bg-surface text-text hover:text-accent hover:border-accent border-border shadow-2xs hover:bg-surface-2'
                    }`}
                    title={isThisPlaying ? 'Pause sentence playback' : 'Play this sentence alone'}
                    aria-label={isThisPlaying ? `Pause sentence ${idx + 1}` : `Play sentence ${idx + 1}`}
                  >
                    {isThisPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        <span>Play sentence</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Spoken Text (Highlighted during playback for easy reading) */}
              <div className={`mt-3 p-3.5 rounded-xl border transition-all ${
                isThisPlaying
                  ? 'bg-accent-soft border-accent/30 text-text shadow-2xs'
                  : 'bg-surface-2/60 border-border'
              }`}>
                <p className={`leading-relaxed ${
                  isThisPlaying ? 'font-bold text-accent-text text-base' : 'font-medium text-text text-sm'
                }`}>
                  "{item.text}"
                </p>
              </div>

              {/* Acoustic Evidence Grid */}
              <div className="mt-3.5 pt-3.5 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {/* Cadence / WPM */}
                <div className="p-2.5 rounded-xl bg-surface-2 border border-border">
                  <span className="text-xs text-text-muted block">Speaking Rate</span>
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
                  <span className="text-xs text-text-muted block">Pitch Modulation</span>
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
                  <span className="text-xs text-text-muted block">Vocal Energy</span>
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
                  <span className="text-xs text-text-muted block">Intonation Contour</span>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="font-bold text-text">
                      {exp?.intonation || 'UPLIFTING'}
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
