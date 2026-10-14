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
import { FeatureTimeSeries } from '../types';

interface FeatureChartProps {
  data: FeatureTimeSeries;
  selectedFlawTime?: { start: number; end: number } | null;
}

export const FeatureChart: React.FC<FeatureChartProps> = ({ data, selectedFlawTime }) => {
  const [activeMetric, setActiveMetric] = useState<'pitch' | 'rms' | 'wpm' | 'deviations'>('pitch');

  // Prepare chart rows
  const chartData = data.timePoints.map((t, idx) => ({
    time: t,
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
      title: 'Pitch / Fundamental Frequency (F0)',
      yUnit: 'Hz',
      refKey: 'refPitch',
      partKey: 'partPitch',
      refName: 'Reference Pitch (Hz)',
      partName: 'Participant Pitch (Hz)',
      refColor: '#38bdf8',
      partColor: '#f43f5e',
      description: 'Tracks intonational modulation and tonal variety. Suppressed spread indicates monotone delivery.',
    },
    rms: {
      title: 'Vocal Energy & RMS Loudness',
      yUnit: 'RMS',
      refKey: 'refRms',
      partKey: 'partRms',
      refName: 'Reference Energy',
      partName: 'Participant Energy',
      refColor: '#38bdf8',
      partColor: '#fbbf24',
      description: 'Measures vocal projection and dynamic emphasis. Sharp dips represent fading energy.',
    },
    wpm: {
      title: 'Speaking Rate Cadence (Words Per Minute)',
      yUnit: 'WPM',
      refKey: 'refWpm',
      partKey: 'partWpm',
      refName: 'Reference Cadence (WPM)',
      partName: 'Participant Cadence (WPM)',
      refColor: '#38bdf8',
      partColor: '#a855f7',
      description: 'Measures local pacing. Deviations over +25% qualify as rushed delivery.',
    },
    deviations: {
      title: 'Composite Temporal Deviation Score',
      yUnit: 'Dev',
      refKey: 'deviation',
      partKey: '',
      refName: 'Deviation Score (0 - 1.0)',
      partName: '',
      refColor: '#f43f5e',
      partColor: '',
      description: 'Multi-feature weighted deviation metric. Values above threshold indicate delivery flaws.',
    },
  }[activeMetric];

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">{metricsConfig.title}</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Acoustic Curves
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{metricsConfig.description}</p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          {(['pitch', 'rms', 'wpm', 'deviations'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setActiveMetric(m)}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                activeMetric === m
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m === 'wpm' ? 'Speaking Rate' : m === 'deviations' ? 'Deviation Score' : m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              tickFormatter={(t) => `${t}s`}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fontSize: 11 }}
              unit={activeMetric === 'rms' ? '' : ` ${metricsConfig.yUnit}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#f8fafc',
              }}
              formatter={(value: any, name: any) => [value, name]}
              labelFormatter={(label) => `Timestamp: ${label}s`}
            />
            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
            />

            {/* Selected flaw highlight area */}
            {selectedFlawTime && (
              <ReferenceArea
                x1={selectedFlawTime.start}
                x2={selectedFlawTime.end}
                stroke="#f43f5e"
                strokeOpacity={0.6}
                fill="#f43f5e"
                fillOpacity={0.15}
              />
            )}

            {/* General flaw areas */}
            {data.flawRegions.map((f, i) => (
              <ReferenceArea
                key={i}
                x1={f.start}
                x2={f.end}
                fill="#f43f5e"
                fillOpacity={0.06}
              />
            ))}

            {activeMetric === 'deviations' ? (
              <Line
                type="monotone"
                dataKey="deviation"
                name={metricsConfig.refName}
                stroke={metricsConfig.refColor}
                strokeWidth={2.5}
                dot={false}
              />
            ) : (
              <>
                <Line
                  type="monotone"
                  dataKey={metricsConfig.refKey}
                  name={metricsConfig.refName}
                  stroke={metricsConfig.refColor}
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey={metricsConfig.partKey}
                  name={metricsConfig.partName}
                  stroke={metricsConfig.partColor}
                  strokeWidth={2}
                  dot={false}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
