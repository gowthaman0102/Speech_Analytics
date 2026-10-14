import React, { useState } from 'react';
import { AlertTriangle, Lightbulb, TrendingUp, Cpu, Volume2, ArrowRight } from 'lucide-react';
import { FlawSegment } from '../types';

interface FlawCardProps {
  flaw: FlawSegment;
  onPlayTimestamp?: (time: number) => void;
}

export const FlawCard: React.FC<FlawCardProps> = ({ flaw, onPlayTimestamp }) => {
  const [judgeMode, setJudgeMode] = useState<boolean>(false);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {formatTime(flaw.start)} — {formatTime(flaw.end)} ({flaw.duration.toFixed(1)}s)
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                flaw.severity === 'HIGH'
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : flaw.severity === 'MEDIUM'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
              }`}
            >
              {flaw.severity} SEVERITY
            </span>
          </div>
          <h4 className="text-lg font-bold text-white tracking-tight mt-1">
            {flaw.type.replace(/_/g, ' ')}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {onPlayTimestamp && (
            <button
              onClick={() => onPlayTimestamp(flaw.start)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-semibold shadow transition-all"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Play Section</span>
            </button>
          )}

          <button
            onClick={() => setJudgeMode(!judgeMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              judgeMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>{judgeMode ? 'Judge Mode Active' : 'Technical / Judge Mode'}</span>
          </button>
        </div>
      </div>

      {/* Transcript Context */}
      {flaw.transcript && (
        <div className="mt-4 p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Transcript Segment Context:
          </span>
          <p className="text-sm text-slate-200 italic font-serif">"{flaw.transcript}"</p>
        </div>
      )}

      {/* Structured Causal Explanations */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Cause */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2 mb-2 text-rose-400">
            <AlertTriangle className="h-4 w-4" />
            <h5 className="text-xs font-bold uppercase tracking-wider">Acoustic Cause</h5>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{flaw.cause}</p>
        </div>

        {/* Effect */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2 mb-2 text-amber-400">
            <TrendingUp className="h-4 w-4" />
            <h5 className="text-xs font-bold uppercase tracking-wider">Perceptual Effect</h5>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{flaw.effect}</p>
        </div>

        {/* Actionable Recommendation */}
        <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2 mb-2 text-emerald-400">
            <Lightbulb className="h-4 w-4" />
            <h5 className="text-xs font-bold uppercase tracking-wider">Coach Recommendation</h5>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{flaw.recommendation}</p>
        </div>
      </div>

      {/* Technical Judge Mode Panel */}
      {judgeMode && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-amber-500/30 transition-all animate-fadeIn">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="h-4 w-4 text-amber-400" />
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Mathematical Rationale & Measurement Evidence
            </h5>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            {Object.entries(flaw.metrics).map(([key, val]) => (
              <div key={key} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block truncate" title={key}>
                  {key}
                </span>
                <span className="text-sm font-bold text-white mt-0.5 block">
                  {typeof val === 'number' ? val.toFixed(2) : String(val)}
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400 mt-3 border-t border-slate-800/80 pt-2">
            The decision is deterministically classified by computing multi-feature deviation against the reference audio timeline aligned via Dynamic Time Warping (DTW).
          </p>
        </div>
      )}
    </div>
  );
};
