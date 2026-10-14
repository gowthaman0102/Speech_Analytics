import React, { useState } from 'react';
import { Clock, Filter, AlertCircle } from 'lucide-react';
import { Card } from './ui/Card';
import type { FlawSegment } from '../types';

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
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}.${ms}`;
  };

  const formatFlawTitle = (flaw: FlawSegment) => {
    const raw = flaw.type.replace(/_/g, ' ').toLowerCase();
    const capitalized = raw.charAt(0).toUpperCase() + raw.slice(1);
    const delta = flaw.explanation?.metrics?.[0]?.delta_pct;
    if (delta !== undefined && Math.abs(delta) > 0) {
      const sign = delta > 0 ? '+' : '';
      return `${capitalized} (${sign}${Math.round(delta)}%)`;
    }
    return capitalized;
  };

  const getSeverityDot = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return 'bg-rose-500';
      case 'MEDIUM':
        return 'bg-amber-500';
      default:
        return 'bg-amber-400';
    }
  };

  const counts = {
    ALL: flaws.length,
    HIGH: flaws.filter((f) => f.severity === 'HIGH').length,
    MEDIUM: flaws.filter((f) => f.severity === 'MEDIUM').length,
    LOW: flaws.filter((f) => f.severity === 'LOW').length,
  };

  const filteredFlaws = flaws
    .filter((f) => filterSeverity === 'ALL' || f.severity === filterSeverity)
    .sort((a, b) => a.start - b.start);

  return (
    <Card className="p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[var(--accent)]" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
            Temporal Flaw Index
          </h3>
        </div>
        <span className="text-xs font-mono text-[var(--muted-foreground)]">
          {flaws.length} detected
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-3 text-xs">
        <Filter className="w-3 h-3 text-[var(--muted-foreground)] mr-1 shrink-0" aria-hidden="true" />
        {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
          <button
            key={sev}
            type="button"
            onClick={() => setFilterSeverity(sev)}
            className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              filterSeverity === sev
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface-2)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] border border-[var(--border)]'
            }`}
          >
            {sev === 'ALL' ? 'All' : sev.charAt(0) + sev.slice(1).toLowerCase()} ({counts[sev]})
          </button>
        ))}
      </div>

      {/* Flaw List */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[460px] pr-1">
        {filteredFlaws.length === 0 ? (
          <div className="text-center py-10 px-4 text-xs text-[var(--muted-foreground)] bg-[var(--surface-2)] rounded border border-[var(--border)]">
            <AlertCircle className="w-5 h-5 mx-auto mb-1 text-emerald-600 opacity-80" />
            <p className="font-medium text-[var(--foreground)]">No flaws matching filter</p>
            <p className="mt-0.5">Delivery adhered closely to the baseline criteria.</p>
          </div>
        ) : (
          filteredFlaws.map((flaw) => {
            const isSelected = selectedFlawId === flaw.id;

            return (
              <div
                key={flaw.id}
                onClick={() => onSelectFlaw(flaw)}
                className={`p-3 rounded-md border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[var(--surface-2)] border-[var(--accent)] shadow-xs ring-1 ring-[var(--accent)]'
                    : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectFlaw(flaw);
                  }
                }}
                aria-pressed={isSelected}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-[var(--foreground)]">
                    {formatTime(flaw.start)} – {formatTime(flaw.end)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${getSeverityDot(flaw.severity)}`}
                      title={`${flaw.severity} severity`}
                    />
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--muted-foreground)]">
                      {flaw.severity}
                    </span>
                  </div>
                </div>

                <div className="mt-1.5 font-medium text-xs text-[var(--foreground)]">
                  {formatFlawTitle(flaw)}
                </div>

                {flaw.transcript && (
                  <p className="text-[11px] text-[var(--muted-foreground)] mt-1 line-clamp-1 italic font-serif">
                    "{flaw.transcript}"
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
