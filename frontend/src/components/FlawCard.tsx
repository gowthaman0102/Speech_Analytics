import React, { useState } from 'react';
import { AlertTriangle, Lightbulb, TrendingUp, Cpu, Volume2, HelpCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { FlawSegment } from '../types';

interface FlawCardProps {
  flaw: FlawSegment;
  onPlayTimestamp?: (time: number) => void;
  isFocused?: boolean;
  onSelect?: (flaw: FlawSegment) => void;
}

export const FlawCard: React.FC<FlawCardProps> = ({ flaw, onPlayTimestamp, isFocused, onSelect }) => {
  const [viewMode, setViewMode] = useState<'coaching' | 'technical'>('coaching');
  const [showWhyFlagged, setShowWhyFlagged] = useState<boolean>(false);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div
      onClick={() => onSelect?.(flaw)}
      className={`rounded-2xl border transition-all duration-300 p-6 shadow-xl backdrop-blur-sm cursor-pointer ${
        isFocused
          ? 'bg-slate-900 border-cyan-400 ring-2 ring-cyan-500/30 shadow-cyan-950/50'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
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
          <h4 className="text-lg font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <span>{flaw.type.replace(/_/g, ' ')}</span>
          </h4>
        </div>

        <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {onPlayTimestamp && (
            <button
              onClick={() => onPlayTimestamp(flaw.start)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 text-white text-xs font-semibold shadow transition-all"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Play Snippet</span>
            </button>
          )}

          <button
            onClick={() => setShowWhyFlagged(!showWhyFlagged)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              showWhyFlagged
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Why was this flagged?</span>
            {showWhyFlagged ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            <button
              onClick={() => setViewMode('coaching')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                viewMode === 'coaching'
                  ? 'bg-slate-800 text-emerald-400 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Simple Coaching
            </button>
            <button
              onClick={() => setViewMode('technical')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                viewMode === 'technical'
                  ? 'bg-slate-800 text-amber-400 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Judge Mode
            </button>
          </div>
        </div>
      </div>

      {/* Transcript Context */}
      {flaw.transcript && (
        <div className="mt-4 p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Grounded Transcript Segment:
          </span>
          <p className="text-sm text-cyan-200/90 italic font-serif">"{flaw.transcript}"</p>
        </div>
      )}

      {/* Explicit "Why Was This Flagged?" Modal/Expansion */}
      {showWhyFlagged && (
        <div className="mt-4 p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 animate-fadeIn">
          <div className="flex items-center gap-2 mb-2 text-cyan-400">
            <HelpCircle className="h-4 w-4" />
            <h5 className="text-xs font-bold uppercase tracking-wider">
              Acoustic Evidence & Threshold Verification
            </h5>
          </div>
          <div className="text-xs text-slate-300 space-y-2">
            <p>
              This delivery segment exceeded the contrastive deviation threshold when compared against the reference speech timeline:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="bg-slate-900/90 p-2 rounded border border-cyan-500/20">
                <span className="text-slate-400 block text-[10px]">Acoustic Metric</span>
                <span className="font-bold text-white">{flaw.metrics?.featureName || 'Speech Contour'}</span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded border border-cyan-500/20">
                <span className="text-slate-400 block text-[10px]">Reference Baseline</span>
                <span className="font-bold text-emerald-400">{String(flaw.metrics?.referenceValue ?? 'Clean standard')}</span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded border border-cyan-500/20">
                <span className="text-slate-400 block text-[10px]">Participant Delivered</span>
                <span className="font-bold text-rose-400">{String(flaw.metrics?.participantValue ?? 'Detected')}</span>
              </div>
              <div className="bg-slate-900/90 p-2 rounded border border-cyan-500/20">
                <span className="text-slate-400 block text-[10px]">Configured Rule</span>
                <span className="font-bold text-amber-400">{flaw.metrics?.configuredThreshold || '> 25% deviation'}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              The acoustic deviation persisted for <span className="text-white font-semibold">{flaw.duration.toFixed(2)}s</span> (exceeding minimum requirement 0.40s) without rhetorical justification.
            </p>
          </div>
        </div>
      )}

      {/* Causal Explanations - Simple Coaching Mode */}
      {viewMode === 'coaching' && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 animate-fadeIn">
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 mb-2 text-rose-400">
              <AlertTriangle className="h-4 w-4" />
              <h5 className="text-xs font-bold uppercase tracking-wider">What Happened</h5>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{flaw.cause}</p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 mb-2 text-amber-400">
              <TrendingUp className="h-4 w-4" />
              <h5 className="text-xs font-bold uppercase tracking-wider">Audience Impact</h5>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{flaw.effect}</p>
          </div>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <Lightbulb className="h-4 w-4" />
              <h5 className="text-xs font-bold uppercase tracking-wider">How to Fix</h5>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{flaw.recommendation}</p>
          </div>
        </div>
      )}

      {/* Technical Judge Mode */}
      {viewMode === 'technical' && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-amber-500/30 transition-all animate-fadeIn">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="h-4 w-4 text-amber-400" />
            <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Technical Rationale & Acoustic Feature Metrics
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

          <div className="mt-3 border-t border-slate-800/80 pt-2 text-xs text-slate-400 flex flex-col sm:flex-row justify-between gap-2">
            <span>Temporal Interval: {flaw.start.toFixed(2)}s to {flaw.end.toFixed(2)}s</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> Signal-grounded (No stochastic LLM score)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
