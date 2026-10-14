import React from 'react';
import { FileText } from 'lucide-react';
import { Card } from './ui/Card';
import type { FlawSegment } from '../types';

interface TranscriptViewerProps {
  transcript: string;
  flaws: FlawSegment[];
  alignmentWords?: Array<any>;
  onSelectFlaw?: (flaw: FlawSegment) => void;
  onSeekTime?: (time: number) => void;
  selectedFlawId?: string;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcript,
  flaws,
  alignmentWords,
  onSelectFlaw,
  onSeekTime,
  selectedFlawId,
}) => {
  const sentences = transcript.split('\n').filter((s) => s.trim().length > 0);

  const handleWordClick = (wordObj: any) => {
    const start = wordObj.part_start ?? wordObj.start ?? 0;
    const end = wordObj.part_end ?? wordObj.end ?? 0;
    onSeekTime?.(start);
    const matchedFlaw = flaws.find(
      (f) => start <= f.end && end >= f.start
    );
    if (matchedFlaw) {
      onSelectFlaw?.(matchedFlaw);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
            <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
              Grounded Delivery Transcript
            </h3>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Click any phrase to jump to its corresponding timestamp in the audio player.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-rose-600 inline-block" />
            <span>Severe flaw</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-amber-600 inline-block" />
            <span>Moderate flaw</span>
          </div>
        </div>
      </div>

      {alignmentWords && alignmentWords.length > 0 ? (
        <div className="p-6 bg-[var(--surface-2)] rounded-md border border-[var(--border)] flex flex-wrap gap-x-1.5 gap-y-2 text-[17px] font-serif text-[var(--foreground)] leading-loose">
          {alignmentWords.map((w: any, idx: number) => {
            const wordText = w.word ?? w.text ?? '';
            const start = w.part_start ?? w.start ?? 0;
            const end = w.part_end ?? w.end ?? 0;
            const overlappingFlaw = flaws.find(
              (f) => start <= f.end && end >= f.start
            );
            const isSelected = overlappingFlaw && selectedFlawId === overlappingFlaw.id;

            let underlineClass = 'hover:text-[var(--accent)]';
            if (isSelected) {
              underlineClass = 'border-b-2 border-[var(--foreground)] bg-[var(--accent-subtle)] font-medium';
            } else if (overlappingFlaw?.severity === 'HIGH') {
              underlineClass = 'border-b-2 border-rose-600 hover:bg-rose-50';
            } else if (overlappingFlaw?.severity === 'MEDIUM') {
              underlineClass = 'border-b-2 border-amber-600 hover:bg-amber-50';
            } else if (overlappingFlaw) {
              underlineClass = 'border-b-2 border-amber-400 hover:bg-amber-50';
            }

            return (
              <span
                key={idx}
                onClick={() => handleWordClick(w)}
                className={`px-0.5 pb-0.5 cursor-pointer transition-colors ${underlineClass}`}
                title={`${wordText} (${start.toFixed(2)}s – ${end.toFixed(2)}s)${
                  overlappingFlaw ? ` • ${overlappingFlaw.type.replace(/_/g, ' ')}` : ''
                }`}
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
        <div className="p-6 bg-[var(--surface-2)] rounded-md border border-[var(--border)] space-y-4 font-serif text-[17px] text-[var(--foreground)] leading-relaxed">
          {sentences.map((sentence, sIdx) => {
            const matchingFlaws = flaws.filter(
              (f) =>
                f.transcript &&
                (sentence.toLowerCase().includes(f.transcript.toLowerCase()) ||
                  f.transcript.toLowerCase().includes(sentence.toLowerCase()))
            );

            if (matchingFlaws.length > 0) {
              const flaw = matchingFlaws[0];
              const isSelected = selectedFlawId === flaw.id;

              return (
                <p
                  key={sIdx}
                  onClick={() => {
                    onSelectFlaw?.(flaw);
                    onSeekTime?.(flaw.start);
                  }}
                  className={`p-2.5 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[var(--accent-subtle)] border-l-2 border-[var(--accent)] font-medium'
                      : flaw.severity === 'HIGH'
                      ? 'border-l-2 border-rose-600 hover:bg-rose-50'
                      : 'border-l-2 border-amber-600 hover:bg-amber-50'
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onSelectFlaw?.(flaw);
                      onSeekTime?.(flaw.start);
                    }
                  }}
                >
                  {sentence}
                </p>
              );
            }

            return (
              <p key={sIdx} className="text-[var(--foreground)] opacity-90">
                {sentence}
              </p>
            );
          })}
        </div>
      )}
    </Card>
  );
};
