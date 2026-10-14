import React from 'react';
import { FileText, Sparkles, Volume2 } from 'lucide-react';
import { FlawSegment } from '../types';

interface TranscriptViewerProps {
  transcript: string;
  flaws: FlawSegment[];
  onSelectFlaw?: (flaw: FlawSegment) => void;
  selectedFlawId?: string;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcript,
  flaws,
  onSelectFlaw,
  selectedFlawId,
}) => {
  // Check which parts of the transcript match flaw snippets
  const sentences = transcript.split('\n').filter((s) => s.trim().length > 0);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">Transcript & Grounded Delivery Flaws</h3>
        </div>
        <span className="text-xs text-slate-400">Click highlighted text to inspect and listen</span>
      </div>

      <div className="p-5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-4 font-serif text-base text-slate-300 leading-relaxed">
        {sentences.map((sentence, sIdx) => {
          // Check if this sentence contains any flaw snippets
          const matchingFlaws = flaws.filter((f) =>
            f.transcript && (sentence.toLowerCase().includes(f.transcript.toLowerCase()) || f.transcript.toLowerCase().includes(sentence.toLowerCase()))
          );

          if (matchingFlaws.length > 0) {
            const flaw = matchingFlaws[0];
            const isSelected = selectedFlawId === flaw.id;

            return (
              <p
                key={sIdx}
                onClick={() => onSelectFlaw?.(flaw)}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-500/20 border-rose-500/70 text-white shadow-md'
                    : 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/15'
                }`}
              >
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 mr-2">
                  <Volume2 className="h-3 w-3" />
                  {flaw.type.replace(/_/g, ' ')} ({flaw.start.toFixed(1)}s - {flaw.end.toFixed(1)}s)
                </span>
                <span>{sentence}</span>
              </p>
            );
          }

          return (
            <p key={sIdx} className="text-slate-300 hover:text-white transition-colors">
              {sentence}
            </p>
          );
        })}
      </div>
    </div>
  );
};
