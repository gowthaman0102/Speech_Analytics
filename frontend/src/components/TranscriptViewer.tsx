import React from 'react';
import { FileText, Volume2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import type { FlawSegment, SentenceAnalysisItem } from '../types';

interface TranscriptViewerProps {
  transcript: string;
  flaws?: FlawSegment[];
  alignmentWords?: Array<any>;
  sentences?: SentenceAnalysisItem[];
  onSelectFlaw?: (flaw: FlawSegment) => void;
  onSeekTime?: (time: number) => void;
  selectedFlawId?: string;
  currentTime?: number;
  isPlaying?: boolean;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcript,
  alignmentWords,
  sentences,
  onSeekTime,
  currentTime,
  isPlaying = false,
}) => {
  const formatTimestamp = (secs: number = 0) => {
    const s = Math.max(0, Number(secs) || 0);
    const mins = Math.floor(s / 60);
    const remSecs = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}.${ms}`;
  };

  const effectiveCurrentTime = currentTime ?? -1;

  const handleWordClick = (w: any) => {
    const start = w.part_start ?? w.start ?? 0;
    onSeekTime?.(start);
  };

  const isWordActive = (start: number, end: number) => {
    if (!isPlaying || effectiveCurrentTime < 0) return false;
    return effectiveCurrentTime >= (start - 0.05) && effectiveCurrentTime <= Math.max(end + 0.05, start + 0.25);
  };

  const wordCount = alignmentWords && alignmentWords.length > 0
    ? alignmentWords.length
    : transcript.trim().split(/\s+/).filter(Boolean).length;

  return (
    <Card className="p-6 text-left">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" aria-hidden="true" />
            <h3 className="text-base font-bold text-text tracking-tight">
              Interactive transcript
            </h3>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Click any word or timestamp to jump audio. Words follow live along with your voice.
          </p>
        </div>

        {/* Live sync & word count badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="teal" size="sm">
            {wordCount} Words
          </Badge>
          {isPlaying && (
            <Badge variant="accent" size="sm">
              <Volume2 className="w-3 h-3 mr-1 animate-pulse" />
              <span>Live synced</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Case 1: Structured Sentences with Aligned Words */}
      {sentences && sentences.length > 0 && alignmentWords && alignmentWords.length > 0 ? (
        <div className="space-y-3">
          {sentences.map((sent, sIdx) => {
            const sStart = sent.start_time ?? 0;
            const sEnd = sent.end_time ?? (sStart + (sent.duration || 3.0));
            const isSentenceActive =
              isPlaying &&
              effectiveCurrentTime >= (sStart - 0.05) &&
              effectiveCurrentTime <= (sEnd + 0.05);

            // Words belonging to this sentence boundary
            const wordsInSentence = alignmentWords.filter((w) => {
              const wst = w.part_start ?? w.start ?? 0;
              return wst >= (sStart - 0.15) && wst < (sEnd + 0.15);
            });

            return (
              <div
                key={sent.sentence_index || sIdx}
                className={`p-4 rounded-xl border transition-all ${
                  isSentenceActive
                    ? 'bg-accent-soft/40 border-accent shadow-xs'
                    : 'bg-surface-2/50 border-border hover:bg-surface-2 hover:border-border-strong'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Clickable Timestamp Chip */}
                  <button
                    type="button"
                    onClick={() => onSeekTime?.(sStart)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-bold tabular-nums shrink-0 mt-0.5 cursor-pointer transition-colors ${
                      isSentenceActive
                        ? 'bg-accent text-white border-accent shadow-2xs'
                        : 'bg-surface text-text-muted hover:text-accent hover:border-accent border-border shadow-2xs'
                    }`}
                    title={`Jump audio to ${formatTimestamp(sStart)}`}
                  >
                    {formatTimestamp(sStart)}
                  </button>

                  {/* Words with Live Highlight */}
                  <div className="flex-1 text-base text-text leading-relaxed flex flex-wrap gap-x-1.5 gap-y-1">
                    {wordsInSentence.length > 0 ? (
                      wordsInSentence.map((w: any, wIdx: number) => {
                        const wordText = w.word ?? w.text ?? '';
                        const start = w.part_start ?? w.start ?? 0;
                        const end = w.part_end ?? w.end ?? 0;
                        const active = isWordActive(start, end);

                        return (
                          <span
                            key={wIdx}
                            onClick={() => handleWordClick(w)}
                            className={`px-1 py-0.5 rounded-md cursor-pointer transition-all ${
                              active
                                ? 'bg-accent text-white font-bold shadow-2xs scale-105'
                                : 'text-text hover:bg-surface-3 hover:text-accent'
                            }`}
                            title={`▶ ${wordText} (${start.toFixed(1)}s – ${end.toFixed(1)}s)`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleWordClick(w);
                            }}
                          >
                            {wordText}
                          </span>
                        );
                      })
                    ) : (
                      <span
                        onClick={() => onSeekTime?.(sStart)}
                        className="cursor-pointer hover:text-accent font-medium"
                      >
                        {sent.text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : alignmentWords && alignmentWords.length > 0 ? (
        /* Case 2: Continuous Interactive Flow */
        <div className="p-6 bg-surface-2 rounded-xl border border-border flex flex-wrap gap-x-1.5 gap-y-2 text-[17px] text-text leading-[1.9]">
          {alignmentWords.map((w: any, idx: number) => {
            const wordText = w.word ?? w.text ?? '';
            const start = w.part_start ?? w.start ?? 0;
            const end = w.part_end ?? w.end ?? 0;
            const active = isWordActive(start, end);

            return (
              <span
                key={idx}
                onClick={() => handleWordClick(w)}
                className={`px-1.5 py-0.5 rounded-md cursor-pointer transition-all ${
                  active
                    ? 'bg-accent text-white font-bold shadow-2xs scale-105'
                    : 'text-text hover:bg-surface-3 hover:text-accent'
                }`}
                title={`▶ ${wordText} (${start.toFixed(1)}s – ${end.toFixed(1)}s)`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleWordClick(w);
                }}
              >
                {wordText}
              </span>
            );
          })}
        </div>
      ) : (
        /* Case 3: Fallback Plain Text */
        <div className="p-6 bg-surface-2 rounded-xl border border-border space-y-4 text-[17px] text-text leading-[1.8]">
          {transcript.split('\n').filter((s) => s.trim().length > 0).map((sentence, sIdx) => (
            <p key={sIdx} className="text-text font-medium">
              {sentence}
            </p>
          ))}
        </div>
      )}
    </Card>
  );
};
