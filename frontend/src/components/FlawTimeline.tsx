import React from 'react';
import { Clock, AlertCircle, ChevronRight, Play } from 'lucide-react';
import { FlawSegment } from '../types';

interface FlawTimelineProps {
  flaws: FlawSegment[];
  selectedFlawId?: string;
  onSelectFlaw: (flaw: FlawSegment) => void;
}

export const FlawTimeline: React.FC<FlawTimelineProps> = ({
  flaws,
  selectedFlawId,
  onSelectFlaw,
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}.${ms}`;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">Temporal Flaw Timeline</h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          {flaws.length} Events
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-5">
        Click any event to automatically seek audio and inspect causal diagnostics
      </p>

      {flaws.length === 0 ? (
        <div className="text-center py-10 bg-slate-950/50 rounded-xl border border-slate-800/80">
          <AlertCircle className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-200">No Significant Delivery Flaws Detected</p>
          <p className="text-xs text-slate-400 mt-1">
            The performance matched the reference baseline with exceptional fidelity.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {flaws.map((flaw) => {
            const isSelected = selectedFlawId === flaw.id;

            return (
              <div
                key={flaw.id}
                onClick={() => onSelectFlaw(flaw)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800/90 border-indigo-500/80 shadow-md shadow-indigo-500/10 translate-x-1'
                    : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="text-cyan-400 font-bold">{formatTime(flaw.start)}</span>
                    <span className="text-slate-600">—</span>
                    <span className="text-cyan-400 font-bold">{formatTime(flaw.end)}</span>
                    <span className="text-[10px] text-slate-500">({flaw.duration.toFixed(1)}s)</span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getSeverityBadge(flaw.severity)}`}>
                    {flaw.severity}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                      {flaw.type.replace(/_/g, ' ')}
                    </h5>
                    {flaw.transcript && (
                      <p className="text-xs text-slate-400 mt-0.5 italic line-clamp-1">
                        "{flaw.transcript}"
                      </p>
                    )}
                  </div>
                  <button
                    className={`p-1.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 group-hover:text-white'
                    }`}
                    title="Seek audio to timestamp"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
