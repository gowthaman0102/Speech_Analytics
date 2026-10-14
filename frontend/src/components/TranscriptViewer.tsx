import React from 'react';
import { FileText, Volume2, Bookmark } from 'lucide-react';
import { FlawSegment } from '../types';

interface TranscriptViewerProps {
  transcript: string;
  flaws: FlawSegment[];
  alignmentWords?: Array<{
    word: string;
    ref_start: number;
    ref_end: number;
    part_start: number;
    part_end: number;
  }>;
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

  const handleWordClick = (wordObj: { word: string; part_start: number; part_end: number }) => {
    onSeekTime?.(wordObj.part_start);
    // Find overlapping flaw
    const matchedFlaw = flaws.find(
      (f) => wordObj.part_start <= f.end && wordObj.part_end >= f.start
    );
    if (matchedFlaw) {
      onSelectFlaw?.(matchedFlaw);
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">Transcript & Grounded Delivery Regions</h3>
        </div>
        <span className="text-xs text-slate-400">
          Click any word or sentence to synchronize player & timeline
        </span>
      </div>

      {alignmentWords && alignmentWords.length > 0 ? (
        <div className="p-5 bg-slate-950/80 rounded-xl border border-slate-800/80 flex flex-wrap gap-x-1.5 gap-y-2 text-base text-slate-300 font-serif leading-relaxed">
          {alignmentWords.map((w, idx) => {
            const overlappingFlaw = flaws.find(
              (f) => w.part_start <= f.end && w.part_end >= f.start
            );
            const isSelected = overlappingFlaw && selectedFlawId === overlappingFlaw.id;

            return (
              <span
                key={idx}
                onClick={() => handleWordClick(w)}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-rose-500/30 text-rose-200 border border-rose-500/80 ring-1 ring-rose-500 shadow-sm font-semibold'
                    : overlappingFlaw
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
                title={`${w.word} (${w.part_start.toFixed(2)}s - ${w.part_end.toFixed(2)}s)${
                  overlappingFlaw ? ` • ${overlappingFlaw.type}` : ''
                }`}
              >
                {w.word}
              </span>
            );
          })}
        </div>
      ) : (
        <div className="p-5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-4 font-serif text-base text-slate-300 leading-relaxed">
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
                <div
                  key={sIdx}
                  onClick={() => {
                    onSelectFlaw?.(flaw);
                    onSeekTime?.(flaw.start);
                  }}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500/20 border-rose-500/70 text-white shadow-md'
                      : 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/15'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      <Volume2 className="h-3 w-3" />
                      {flaw.type.replace(/_/g, ' ')} ({flaw.start.toFixed(1)}s - {flaw.end.toFixed(1)}s)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Click to seek audio</span>
                  </div>
                  <p>{sentence}</p>
                </div>
              );
            }

            return (
              <p
                key={sIdx}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                onClick={() => onSeekTime?.(sIdx * 6.0)}
              >
                {sentence}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );
};
