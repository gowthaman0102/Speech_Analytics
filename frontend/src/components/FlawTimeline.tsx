import React, { useState } from 'react';
import { Clock, Filter, CheckCircle2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
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
        return 'bg-danger';
      case 'MEDIUM':
        return 'bg-flaw-medium';
      default:
        return 'bg-flaw-low';
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
    <Card className="p-5 flex flex-col h-full text-left">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent" aria-hidden="true" />
          <h3 className="text-sm font-bold text-text tracking-tight">
            Flagged moments index
          </h3>
        </div>
        <span className="text-xs font-semibold text-text-muted">
          {flaws.length} flagged
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 mb-3 text-xs">
        <Filter className="w-3.5 h-3.5 text-text-muted mr-0.5 shrink-0" aria-hidden="true" />
        {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((sev) => (
          <button
            key={sev}
            type="button"
            onClick={() => setFilterSeverity(sev)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              filterSeverity === sev
                ? 'bg-accent text-white shadow-2xs'
                : 'bg-surface-2 text-text-muted hover:text-text border border-border'
            }`}
          >
            {sev === 'ALL' ? 'All' : sev.charAt(0) + sev.slice(1).toLowerCase()} ({counts[sev]})
          </button>
        ))}
      </div>

      {/* Flaw List */}
      <div className="flex-1 overflow-y-auto space-y-2 max-h-[460px] pr-1">
        {filteredFlaws.length === 0 ? (
          <div className="text-center py-10 px-4 text-xs text-text-muted bg-surface-2 rounded-xl border border-border">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1.5 text-success opacity-90" />
            <p className="font-bold text-text">No moments matching filter</p>
            <p className="mt-0.5">Delivery adhered closely to the target standard.</p>
          </div>
        ) : (
          filteredFlaws.map((flaw) => {
            const isSelected = selectedFlawId === flaw.id;

            return (
              <div
                key={flaw.id}
                onClick={() => onSelectFlaw(flaw)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-surface-2 border-accent shadow-2xs ring-2 ring-accent/30'
                    : 'bg-surface border-border hover:border-border-strong'
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
                  <span className="tabular-nums text-xs font-bold text-text">
                    {formatTime(flaw.start)} – {formatTime(flaw.end)}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${getSeverityDot(flaw.severity)}`}
                      title={`${flaw.severity} severity`}
                    />
                    <span className="text-xs font-semibold text-text-muted capitalize">
                      {flaw.severity.toLowerCase()}
                    </span>
                  </div>
                </div>

                <div className="mt-1 font-bold text-xs text-text">
                  {formatFlawTitle(flaw)}
                </div>

                {flaw.transcript && (
                  <p className="text-xs text-text-muted mt-1 line-clamp-1 italic">
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
