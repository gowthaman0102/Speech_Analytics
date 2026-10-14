import React, { useState } from 'react';
import { Volume2, ChevronDown, ChevronUp, Lightbulb, Compass } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from './ui/Table';
import type { FlawSegment } from '../types';

interface FlawCardProps {
  flaw: FlawSegment;
  onPlayTimestamp?: (time: number) => void;
  isFocused?: boolean;
}

export const FlawCard: React.FC<FlawCardProps> = ({ flaw, onPlayTimestamp }) => {
  const [showMeasurements, setShowMeasurements] = useState<boolean>(false);

  const formatTime = (secs: number = 0) => {
    const s = Number(secs) || 0;
    const mins = Math.floor(s / 60);
    const remSecs = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}.${ms}`;
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'HIGH':
        return <Badge variant="danger">High</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning">Medium</Badge>;
      default:
        return <Badge variant="neutral">Low</Badge>;
    }
  };

  const title = flaw.type.replace(/_/g, ' ').toLowerCase();
  const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1);

  const explanation = flaw.explanation;
  const metrics: any[] = explanation?.metrics ?? (Array.isArray(flaw.metrics) ? flaw.metrics : []);

  const cause = explanation?.cause || flaw.cause;
  const effect = explanation?.effect || flaw.effect;
  const recommendation = explanation?.recommendation || flaw.recommendation;
  const summary = explanation?.summary || 'The delivery exhibited measurable difference from the reference standard.';
  const flawDuration = flaw.duration ?? (flaw.end !== undefined && flaw.start !== undefined ? flaw.end - flaw.start : 0);

  return (
    <Card className="p-6 text-left">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-surface-2 text-text border border-border">
              {formatTime(flaw.start)} – {formatTime(flaw.end)} ({(flawDuration ?? 0).toFixed(1)}s)
            </span>
            {getSeverityBadge(flaw.severity)}
          </div>
          <h4 className="text-lg font-bold text-text tracking-tight">
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
              <Volume2 className="w-3.5 h-3.5 text-accent" />
              <span>Play snippet</span>
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => setShowMeasurements(!showMeasurements)}
            className="flex items-center gap-1 text-xs text-text-muted hover:text-text"
          >
            <span>{showMeasurements ? 'Hide measurements' : 'Show measurements'}</span>
            {showMeasurements ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Spoken phrase quote */}
      {flaw.transcript && (
        <div className="my-4 p-4 rounded-xl bg-surface-2 border-l-4 border-l-accent">
          <p className="text-xs text-text-muted font-bold mb-1">Spoken phrase:</p>
          <p className="text-sm text-text font-medium leading-relaxed">
            "{flaw.transcript}"
          </p>
        </div>
      )}

      {/* Plain language summary */}
      <div className="my-4">
        <h5 className="text-xs font-bold text-text-muted mb-1">
          Delivery observation
        </h5>
        <p className="text-sm text-text leading-relaxed">
          {summary}
        </p>
      </div>

      {/* Actionable Coaching Recommendation */}
      {recommendation && (
        <div className="p-4 rounded-xl border border-accent/20 bg-accent-soft my-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-accent-text mb-1">
            <Lightbulb className="w-4 h-4 shrink-0" />
            <span>Coaching recommendation</span>
          </div>
          <p className="text-xs text-text leading-relaxed font-medium">
            {recommendation}
          </p>
        </div>
      )}

      {/* Cause & Effect breakdown */}
      {(cause || effect) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4 pt-3 border-t border-border text-xs">
          {cause && (
            <div>
              <span className="font-bold text-text block mb-1">What happened:</span>
              <p className="text-text-muted leading-relaxed">{cause}</p>
            </div>
          )}
          {effect && (
            <div>
              <span className="font-bold text-text block mb-1">Effect on listener:</span>
              <p className="text-text-muted leading-relaxed">{effect}</p>
            </div>
          )}
        </div>
      )}

      {/* Optional Acoustic Measurements Disclosure */}
      {showMeasurements && (
        <div className="mt-4 pt-4 border-t border-border">
          <h5 className="text-xs font-bold text-text mb-2.5 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-accent" />
            <span>Acoustic measurements & reference comparison</span>
          </h5>

          {metrics.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Difference</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.map((m: any, idx: number) => {
                  const metricName = m.name ?? m.featureName ?? 'Acoustic metric';
                  const refVal = m.reference_val ?? m.referenceValue;
                  const partVal = m.participant_val ?? m.participantValue;
                  const deltaPct = m.delta_pct ?? m.differencePercent ?? 0;
                  const unit = m.unit ?? '';
                  const sign = typeof deltaPct === 'number' && deltaPct > 0 ? '+' : '';
                  const isFlagged = m.threshold_pct ? Math.abs(deltaPct) >= m.threshold_pct : true;

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-bold text-text">{metricName}</TableCell>
                      <TableCell className="tabular-nums text-xs text-text-muted">
                        {typeof refVal === 'number' ? `${refVal.toFixed(1)} ${unit}` : refVal !== undefined ? `${refVal} ${unit}` : '—'}
                      </TableCell>
                      <TableCell className="tabular-nums text-xs font-bold text-text">
                        {typeof partVal === 'number' ? `${partVal.toFixed(1)} ${unit}` : partVal !== undefined ? `${partVal} ${unit}` : '—'}
                      </TableCell>
                      <TableCell className="tabular-nums text-xs font-bold text-accent">
                        {typeof deltaPct === 'number' ? `${sign}${deltaPct.toFixed(1)}%` : deltaPct}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isFlagged ? 'danger' : 'success'} size="sm">
                          {isFlagged ? 'Flagged' : 'Within range'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-3 bg-surface-2 rounded-xl text-xs text-text-muted">
              Individual measurements were combined into the composite score.
            </div>
          )}

          {explanation?.why_flagged && (
            <div className="mt-3 p-3 rounded-xl bg-surface-2 border border-border text-xs text-text-muted">
              <span className="font-bold text-text mr-1">Guideline rule:</span>
              {explanation.why_flagged}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
