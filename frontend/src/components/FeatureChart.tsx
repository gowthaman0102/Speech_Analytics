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
import { Badge } from './ui/Badge';
import type { FeatureTimeSeries } from '../types';

interface FeatureChartProps {
  data: FeatureTimeSeries;
  selectedFlawTime?: { start: number; end: number } | null;
}

export const FeatureChart: React.FC<FeatureChartProps> = ({ data, selectedFlawTime }) => {
  const [activeMetric, setActiveMetric] = useState<'pitch' | 'rms' | 'wpm' | 'deviations'>('pitch');

  const formatTimeTick = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const timePoints = data?.timePoints || [];
  const refPitch = data?.referenceFeatures?.pitch || [];
  const partPitch = data?.participantFeatures?.pitch || [];
  const refRms = data?.referenceFeatures?.rms || [];
  const partRms = data?.participantFeatures?.rms || [];
  const refWpm = data?.referenceFeatures?.wpm || [];
  const partWpm = data?.participantFeatures?.wpm || [];
  const deviations = data?.deviations || [];

  const chartData = timePoints.map((t, idx) => ({
    time: Number((t ?? 0).toFixed(2)),
    refPitch: refPitch[idx] ? Math.round(refPitch[idx]) : null,
    partPitch: partPitch[idx] ? Math.round(partPitch[idx]) : null,
    refRms: typeof refRms[idx] === 'number' ? Number(refRms[idx].toFixed(3)) : 0,
    partRms: typeof partRms[idx] === 'number' ? Number(partRms[idx].toFixed(3)) : 0,
    refWpm: typeof refWpm[idx] === 'number' ? Math.round(refWpm[idx]) : 130,
    partWpm: typeof partWpm[idx] === 'number' ? Math.round(partWpm[idx]) : 130,
    deviation: typeof deviations[idx] === 'number' ? Number(deviations[idx].toFixed(2)) : 0,
  }));

  const metricsConfig = {
    pitch: {
      title: 'Melody & Pitch Contour',
      yUnit: 'Hz',
      refKey: 'refPitch',
      partKey: 'partPitch',
      refName: 'Reference pitch (Hz)',
      partName: 'Participant pitch (Hz)',
      description: 'Tracks inflection, intonation, and vocal melody across aligned words.',
    },
    rms: {
      title: 'Dynamic Energy & Projection',
      yUnit: 'RMS',
      refKey: 'refRms',
      partKey: 'partRms',
      refName: 'Reference energy',
      partName: 'Participant energy',
      description: 'Measures vocal projection and dynamic volume emphasis throughout the speech.',
    },
    wpm: {
      title: 'Speaking Pace & Rhythm',
      yUnit: 'WPM',
      refKey: 'refWpm',
      partKey: 'partWpm',
      refName: 'Reference pace (WPM)',
      partName: 'Participant pace (WPM)',
      description: 'Measures localized speed. Highlights rushed phrases or dragging delivery.',
    },
    deviations: {
      title: 'Overall Delivery Difference',
      yUnit: 'Score',
      refKey: 'deviation',
      partKey: '',
      refName: 'Difference score (0.0 – 1.0)',
      partName: '',
      description: 'Combined delivery difference curve. Spikes above threshold denote flagged moments.',
    },
  }[activeMetric];

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-text tracking-tight">
              {metricsConfig.title}
            </h3>
            <Badge variant="teal" size="sm">
              Delivery curves
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {metricsConfig.description}
          </p>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex rounded-xl border border-border bg-surface-2 p-1 text-xs font-semibold">
          {(
            [
              { key: 'pitch', label: 'Pitch / Melody' },
              { key: 'rms', label: 'Energy' },
              { key: 'wpm', label: 'Pace' },
              { key: 'deviations', label: 'Difference curve' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveMetric(item.key)}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeMetric === item.key
                  ? 'bg-surface text-text font-bold shadow-xs'
                  : 'text-text-muted hover:text-text'
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
            <CartesianGrid strokeDasharray="3 3" stroke="#EBD8C4" vertical={false} />

            <XAxis
              dataKey="time"
              stroke="#7A6552"
              fontSize={12}
              tickLine={false}
              tickFormatter={formatTimeTick}
            />

            <YAxis
              stroke="#7A6552"
              fontSize={12}
              tickLine={false}
              unit={` ${metricsConfig.yUnit}`}
              width={55}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-surface border-[1.5px] border-border p-3.5 rounded-xl shadow-xs text-xs space-y-1.5">
                      <p className="text-text-muted font-bold mb-1">
                        Time: {label}s ({formatTimeTick(Number(label))})
                      </p>
                      {payload.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4">
                          <span style={{ color: entry.color }} className="font-semibold">
                            {entry.name}:
                          </span>
                          <span className="font-bold text-text tabular-nums">
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
              wrapperStyle={{ paddingTop: 14, fontSize: 13 }}
              formatter={(value) => <span className="text-text font-semibold">{value}</span>}
            />

            {/* Selected flaw region shading */}
            {selectedFlawTime && (
              <ReferenceArea
                x1={selectedFlawTime.start}
                x2={selectedFlawTime.end}
                fill="#C2562D"
                fillOpacity={0.15}
                stroke="#C2562D"
                strokeOpacity={0.5}
                strokeDasharray="3 3"
              />
            )}

            {/* Series lines: 2.5px thick, dot={false} */}
            {activeMetric !== 'deviations' ? (
              <>
                <Line
                  type="monotone"
                  dataKey={metricsConfig.refKey}
                  name={metricsConfig.refName}
                  stroke="#2F6F73"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, stroke: '#2F6F73', strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey={metricsConfig.partKey}
                  name={metricsConfig.partName}
                  stroke="#C2562D"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, stroke: '#C2562D', strokeWidth: 1 }}
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey="deviation"
                name="Delivery difference"
                stroke="#C2562D"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, stroke: '#C2562D', strokeWidth: 1 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-right text-xs text-text-muted">
        Timepoints synchronized across deliveries
      </div>
    </Card>
  );
};
