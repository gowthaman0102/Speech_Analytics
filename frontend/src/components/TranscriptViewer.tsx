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
    <Card className="p-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" aria-hidden="true" />
            <h3 className="text-base font-bold text-text tracking-tight">
              Interactive transcript
            </h3>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Click any word or sentence to jump to that moment in the recording.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-danger inline-block rounded-full" />
            <span>High flag</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-flaw-medium inline-block rounded-full" />
            <span>Medium flag</span>
          </div>
        </div>
      </div>

      {alignmentWords && alignmentWords.length > 0 ? (
        <div className="p-6 bg-surface-2 rounded-xl border border-border flex flex-wrap gap-x-1.5 gap-y-2 text-[17px] text-text leading-[1.8]">
          {alignmentWords.map((w: any, idx: number) => {
            const wordText = w.word ?? w.text ?? '';
            const start = w.part_start ?? w.start ?? 0;
            const end = w.part_end ?? w.end ?? 0;
            const overlappingFlaw = flaws.find(
              (f) => start <= f.end && end >= f.start
            );
            const isSelected = overlappingFlaw && selectedFlawId === overlappingFlaw.id;

            let underlineClass = 'hover:text-accent';
            if (isSelected) {
              underlineClass = 'border-b-2 border-accent bg-accent-soft text-accent-text font-bold rounded-xs';
            } else if (overlappingFlaw?.severity === 'HIGH') {
              underlineClass = 'border-b-2 border-danger hover:bg-danger-soft';
            } else if (overlappingFlaw?.severity === 'MEDIUM') {
              underlineClass = 'border-b-2 border-flaw-medium hover:bg-warning-soft';
            } else if (overlappingFlaw) {
              underlineClass = 'border-b-2 border-flaw-low hover:bg-warning-soft';
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
        <div className="p-6 bg-surface-2 rounded-xl border border-border space-y-4 text-[17px] text-text leading-[1.8]">
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
                  className={`p-3 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-accent-soft border-l-4 border-l-accent font-bold text-accent-text'
                      : flaw.severity === 'HIGH'
                      ? 'border-l-4 border-l-danger bg-surface hover:bg-danger-soft'
                      : 'border-l-4 border-l-flaw-medium bg-surface hover:bg-warning-soft'
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
              <p key={sIdx} className="text-text opacity-95">
                {sentence}
              </p>
            );
          })}
        </div>
      )}
    </Card>
  );
};
