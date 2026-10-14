import React, { useState } from 'react';
import { Volume2, ChevronDown, ChevronUp, Lightbulb, Compass } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/Table';
import type { FlawSegment, FlawMetricDetail } from '../types';

interface FlawCardProps {
  flaw: FlawSegment;
  onPlayTimestamp?: (time: number) => void;
  isFocused?: boolean;
}

export const FlawCard: React.FC<FlawCardProps> = ({ flaw, onPlayTimestamp }) => {
  const [showMeasurements, setShowMeasurements] = useState<boolean>(false);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}.${ms}`;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return <Badge variant="danger">High Severity</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning">Medium Severity</Badge>;
      default:
        return <Badge variant="default">Low Severity</Badge>;
    }
  };

  const title = flaw.type.replace(/_/g, ' ').toLowerCase();
  const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);

  const explanation = flaw.explanation;
  const metrics: FlawMetricDetail[] = explanation?.metrics ?? [];

  const cause = explanation?.cause || flaw.cause;
  const effect = explanation?.effect || flaw.effect;
  const recommendation = explanation?.recommendation || flaw.recommendation;
  const summary = explanation?.summary || 'The delivery exhibited measurable divergence from the baseline standard.';

  return (
    <Card className="p-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border)]">
              {formatTime(flaw.start)} – {formatTime(flaw.end)} ({flaw.duration.toFixed(1)}s)
            </span>
            {getSeverityBadge(flaw.severity)}
          </div>
          <h4 className="text-lg font-semibold text-[var(--foreground)] tracking-tight">
            {formattedTitle}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          {onPlayTimestamp && (
            <Button
              variant="secondary"
              onClick={() => onPlayTimestamp(flaw.start)}
              className="flex items-center gap-1.5 text-xs"
            >
              <Volume2 className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Play Snippet</span>
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => setShowMeasurements(!showMeasurements)}
            className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <span>{showMeasurements ? 'Hide data' : 'Show data'}</span>
            {showMeasurements ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Spoken phrase quote */}
      {flaw.transcript && (
        <div className="my-4 p-3 rounded bg-[var(--surface-2)] border-l-2 border-[var(--accent)]">
          <p className="text-xs text-[var(--muted-foreground)] font-mono mb-0.5">Spoken Delivery Excerpt:</p>
          <p className="font-serif italic text-sm text-[var(--foreground)] leading-relaxed">
            "{flaw.transcript}"
          </p>
        </div>
      )}

      {/* Plain language summary */}
      <div className="my-4">
        <h5 className="text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
          Delivery Diagnosis
        </h5>
        <p className="text-sm text-[var(--foreground)] leading-relaxed">
          {summary}
        </p>
      </div>

      {/* Actionable Coaching Recommendation */}
      {recommendation && (
        <div className="p-4 rounded-md border border-[var(--accent-subtle)] bg-[var(--accent-subtle)]/40 my-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--accent)] mb-1">
            <Lightbulb className="w-4 h-4 shrink-0" />
            <span>Coaching Recommendation</span>
          </div>
          <p className="text-xs text-[var(--foreground)] leading-relaxed">
            {recommendation}
          </p>
        </div>
      )}

      {/* Cause & Effect breakdown */}
      {(cause || effect) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 pt-3 border-t border-[var(--border)] text-xs">
          {cause && (
            <div>
              <span className="font-semibold text-[var(--foreground)] block mb-0.5">Acoustic Cause:</span>
              <p className="text-[var(--muted-foreground)] leading-relaxed">{cause}</p>
            </div>
          )}
          {effect && (
            <div>
              <span className="font-semibold text-[var(--foreground)] block mb-0.5">Audience Effect:</span>
              <p className="text-[var(--muted-foreground)] leading-relaxed">{effect}</p>
            </div>
          )}
        </div>
      )}

      {/* Expandable Technical Measurements Table */}
      {showMeasurements && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <h5 className="text-xs font-semibold text-[var(--foreground)] mb-2 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Acoustic Measurements & Diagnostic Comparison</span>
          </h5>

          {metrics.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Acoustic Metric</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Deviation</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((m: FlawMetricDetail, idx: number) => {
                  const sign = m.delta_pct > 0 ? '+' : '';
                  const isFlagged = m.threshold_pct ? Math.abs(m.delta_pct) >= m.threshold_pct : true;

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium text-[var(--foreground)]">{m.name}</TableCell>
                      <TableCell className="font-mono text-xs text-[var(--muted-foreground)]">
                        {m.reference_val.toFixed(1)} {m.unit}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-[var(--foreground)]">
                        {m.participant_val.toFixed(1)} {m.unit}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold text-[var(--series-participant)]">
                        {sign}{m.delta_pct.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-block text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                            isFlagged
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {isFlagged ? 'Flagged Deviation' : 'In Tolerance'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-3 bg-[var(--surface-2)] rounded text-xs text-[var(--muted-foreground)]">
              Detailed scalar feature deltas were compiled into composite score.
            </div>
          )}

          {explanation?.why_flagged && (
            <div className="mt-3 p-3 rounded bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--muted-foreground)]">
              <span className="font-semibold text-[var(--foreground)] mr-1">Threshold Rule:</span>
              {explanation.why_flagged}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
