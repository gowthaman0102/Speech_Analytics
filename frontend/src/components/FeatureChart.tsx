import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceArea,
} from 'recharts';
import { Card } from './ui/Card';
import type { FeatureTimeSeries } from '../types';

interface FeatureChartProps {
  data: FeatureTimeSeries;
  selectedFlawTime?: { start: number; end: number } | null;
}

export const FeatureChart: React.FC<FeatureChartProps> = ({ data, selectedFlawTime }) => {
  const [activeMetric, setActiveMetric] = useState<'pitch' | 'rms' | 'wpm' | 'deviations'>('pitch');

  // Format seconds to mm:ss
  const formatTimeTick = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  // Prepare chart rows
  const chartData = data.timePoints.map((t, idx) => ({
    time: Number(t.toFixed(2)),
    refPitch: data.referenceFeatures.pitch[idx] ? Math.round(data.referenceFeatures.pitch[idx]) : null,
    partPitch: data.participantFeatures.pitch[idx] ? Math.round(data.participantFeatures.pitch[idx]) : null,
    refRms: data.referenceFeatures.rms[idx] ? Number(data.referenceFeatures.rms[idx].toFixed(3)) : 0,
    partRms: data.participantFeatures.rms[idx] ? Number(data.participantFeatures.rms[idx].toFixed(3)) : 0,
    refWpm: data.referenceFeatures.wpm[idx] ? Math.round(data.referenceFeatures.wpm[idx]) : 130,
    partWpm: data.participantFeatures.wpm[idx] ? Math.round(data.participantFeatures.wpm[idx]) : 130,
    deviation: data.deviations[idx] ? Number(data.deviations[idx].toFixed(2)) : 0,
  }));

  const metricsConfig = {
    pitch: {
      title: 'Fundamental Frequency / Pitch (F0)',
      yUnit: 'Hz',
      refKey: 'refPitch',
      partKey: 'partPitch',
      refName: 'Reference Pitch (Hz)',
      partName: 'Participant Pitch (Hz)',
      description: 'Monitors intonational variety and vocal modulation over aligned tokens.',
    },
    rms: {
      title: 'Vocal Energy & Amplitude (RMS)',
      yUnit: 'RMS',
      refKey: 'refRms',
      partKey: 'partRms',
      refName: 'Reference Energy',
      partName: 'Participant Energy',
      description: 'Quantifies vocal projection and dynamic volume emphasis across sentences.',
    },
    wpm: {
      title: 'Speaking Rate Cadence (Words Per Minute)',
      yUnit: 'WPM',
      refKey: 'refWpm',
      partKey: 'partWpm',
      refName: 'Reference Cadence (WPM)',
      partName: 'Participant Cadence (WPM)',
      description: 'Measures localized speed. Deviations exceeding ±20% qualify as rushed or dragging delivery.',
    },
    deviations: {
      title: 'Composite Deviation Vector',
      yUnit: 'Dev',
      refKey: 'deviation',
      partKey: '',
      refName: 'Deviation Score (0.0 – 1.0)',
      partName: '',
      description: 'Multi-feature weighted deviation metric. Spikes above threshold denote flagged delivery flaws.',
    },
  }[activeMetric];

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
              {metricsConfig.title}
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--muted-foreground)] border border-[var(--border)]">
              Acoustic Curves
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            {metricsConfig.description}
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-0.5 text-xs font-medium">
          {(
            [
              { key: 'pitch', label: 'Pitch (F0)' },
              { key: 'rms', label: 'Loudness (RMS)' },
              { key: 'wpm', label: 'Cadence (WPM)' },
              { key: 'deviations', label: 'Deviation Score' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveMetric(item.key)}
              className={`px-3 py-1 rounded transition-colors ${
                activeMetric === item.key
                  ? 'bg-[var(--surface)] text-[var(--foreground)] font-semibold shadow-xs'
                  : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E3E0D8" vertical={false} />

            <XAxis
              dataKey="time"
              stroke="#6B6860"
              fontSize={11}
              tickLine={false}
              tickFormatter={formatTimeTick}
            />

            <YAxis
              stroke="#6B6860"
              fontSize={11}
              tickLine={false}
              unit={` ${metricsConfig.yUnit}`}
              width={55}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[var(--surface)] border border-[var(--border)] p-3 rounded-md shadow-sm text-xs space-y-1">
                      <p className="font-mono text-[var(--muted-foreground)] font-medium mb-1">
                        Time: {label}s ({formatTimeTick(Number(label))})
                      </p>
                      {payload.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4">
                          <span style={{ color: entry.color }} className="font-medium">
                            {entry.name}:
                          </span>
                          <span className="font-mono font-semibold text-[var(--foreground)]">
                            {entry.value} {metricsConfig.yUnit}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />

            <Legend
              wrapperStyle={{ paddingTop: 12, fontSize: 12 }}
              formatter={(value) => <span className="text-[var(--foreground)]">{value}</span>}
            />

            {/* Selected flaw region shading */}
            {selectedFlawTime && (
              <ReferenceArea
                x1={selectedFlawTime.start}
                x2={selectedFlawTime.end}
                fill="#C2571A"
                fillOpacity={0.12}
                stroke="#C2571A"
                strokeOpacity={0.4}
                strokeDasharray="3 3"
              />
            )}

            {/* Series lines */}
            {activeMetric !== 'deviations' ? (
              <>
                <Line
                  type="monotone"
                  dataKey={metricsConfig.refKey}
                  name={metricsConfig.refName}
                  stroke="#1F4E79"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: '#1F4E79', strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey={metricsConfig.partKey}
                  name={metricsConfig.partName}
                  stroke="#C2571A"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, stroke: '#C2571A', strokeWidth: 1 }}
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey="deviation"
                name="Temporal Deviation Score"
                stroke="#C2571A"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#C2571A', strokeWidth: 1 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-right text-[11px] text-[var(--muted-foreground)]">
        Aligned timepoints synchronized via Dynamic Time Warping (DTW)
      </div>
    </Card>
  );
};
