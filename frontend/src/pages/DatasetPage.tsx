import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Database,
  Play,
  Sparkles,
  Layers,
  FileAudio,
  ArrowRight,
  Loader2,
  CheckCircle2,
  TrendingDown,
  BarChart2,
  Gauge,
  Sliders,
  Award,
} from 'lucide-react';
import { evaluationApi } from '../api/evaluationApi';
import { DatasetItem, DatasetVariant, BenchmarkResponse } from '../types';

export const DatasetPage: React.FC = () => {
  const navigate = useNavigate();
  const [dataset, setDataset] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningVariantIndex, setRunningVariantIndex] = useState<number | null>(null);
  const [benchmarkLoading, setBenchmarkLoading] = useState<boolean>(false);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkResponse | null>(null);

  useEffect(() => {
    Promise.all([
      evaluationApi.getDataset(),
      evaluationApi.runBenchmark(false).catch(() => null),
    ])
      .then(([ds, bm]) => {
        setDataset(ds);
        if (bm) setBenchmarkData(bm);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleRunVariant = async (index: number) => {
    setRunningVariantIndex(index);
    try {
      const res = await evaluationApi.evaluateVariant(index);
      navigate(`/results/${res.evaluationId}`);
    } catch (e) {
      console.error(e);
      setRunningVariantIndex(null);
    }
  };

  const handleRunBenchmark = async () => {
    try {
      setBenchmarkLoading(true);
      const res = await evaluationApi.runBenchmark(true);
      setBenchmarkData(res);
    } catch (e) {
      console.error('Benchmark execution error:', e);
    } finally {
      setBenchmarkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 text-cyan-400 animate-spin mb-4" />
        <h3 className="text-xl font-bold text-white tracking-tight">Loading Contrastive Dataset & Benchmarks</h3>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Temporal Contrastive Speech Coach
            </span>
            <span className="text-xs text-slate-500 font-mono">Gradient Matrix</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1.5">
            5-Tier Contrastive Dataset & Temporal Grounding
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Canonical baseline speech and 10 systematic gradient variants evaluating sub-second temporal flaw detection.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleRunBenchmark}
            disabled={benchmarkLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-md transition-all disabled:opacity-50"
          >
            {benchmarkLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
            ) : (
              <BarChart2 className="h-4 w-4 text-cyan-400" />
            )}
            <span>{benchmarkLoading ? 'Benchmarking 10 Tiers...' : 'Run Gradient Benchmark'}</span>
          </button>

          <button
            onClick={() =>
              evaluationApi.startDemoEvaluation().then((r) => navigate(`/results/${r.evaluationId}`))
            }
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>Evaluate Standard Demo</span>
          </button>
        </div>
      </div>

      {/* 5-Tier Quality & Severity Gradient Matrix */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5 text-indigo-400" />
          <h3 className="text-lg font-bold text-white tracking-tight">5-Tier Evaluation Gradient Architecture</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Tier 1: Ideal */}
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 font-mono block mb-1">
                Tier 1
              </span>
              <h4 className="font-bold text-white text-sm">Ideal Standard</h4>
              <p className="text-slate-400 text-[11px] mt-1">
                Master delivery with measured cadence (1.00x), calibrated projection, and expressive pauses.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-850 font-mono text-[10px] text-emerald-400">
              Expected Score: 95–100
            </div>
          </div>

          {/* Tier 2: Almost Perfect */}
          <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono block mb-1">
                Tier 2
              </span>
              <h4 className="font-bold text-white text-sm">Almost Perfect</h4>
              <p className="text-slate-400 text-[11px] mt-1">
                Natural tempo variation (1.05x). Competitive orator standard with no major flaws.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-850 font-mono text-[10px] text-cyan-400">
              Expected Score: 85–92
            </div>
          </div>

          {/* Tier 3: Mildly Flawed */}
          <div className="p-4 rounded-xl bg-slate-950 border border-yellow-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-400 font-mono block mb-1">
                Tier 3
              </span>
              <h4 className="font-bold text-white text-sm">Mildly Flawed</h4>
              <p className="text-slate-400 text-[11px] mt-1">
                1.10x pacing elevation, -3 dB volume fade. Intelligible but noticeable to judges.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-850 font-mono text-[10px] text-yellow-400">
              Expected Score: 75–84
            </div>
          </div>

          {/* Tier 4: Moderately Flawed */}
          <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 font-mono block mb-1">
                Tier 4
              </span>
              <h4 className="font-bold text-white text-sm">Moderately Flawed</h4>
              <p className="text-slate-400 text-[11px] mt-1">
                1.20x rushed delivery, -6 dB volume attenuation, 1.5s hesitation pause gap.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-850 font-mono text-[10px] text-amber-400">
              Expected Score: 65–74
            </div>
          </div>

          {/* Tier 5: Severely Flawed */}
          <div className="p-4 rounded-xl bg-slate-950 border border-rose-500/30 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 font-mono block mb-1">
                Tier 5
              </span>
              <h4 className="font-bold text-white text-sm">Severely Flawed</h4>
              <p className="text-slate-400 text-[11px] mt-1">
                1.40x rushed pace, -10 dB faint projection, 2.8s dead air pause, robotic monotone pitch.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-850 font-mono text-[10px] text-rose-400">
              Expected Score: &lt; 65
            </div>
          </div>
        </div>
      </div>

      {/* Benchmark Verification Summary (If Available) */}
      {benchmarkData && (
        <div className="bg-slate-900/90 rounded-2xl border border-cyan-500/40 p-6 shadow-xl backdrop-blur-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Gradient Benchmark & Score Monotonicity Verification
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluation results across all 10 gradient variants verified against expected ground truth annotations.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span
                className={`px-3 py-1 rounded font-bold border ${
                  benchmarkData.monotonicityPassed
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                {benchmarkData.monotonicityPassed
                  ? '✓ MONOTONICITY SATISFIED'
                  : '⚠ MONOTONICITY PENDING'}
              </span>
              <span className="bg-slate-800 text-cyan-300 border border-slate-700 px-3 py-1 rounded">
                Evaluated: {benchmarkData.totalEvaluated} Tiers
              </span>
            </div>
          </div>

          {/* Benchmark Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono tracking-wider">
                  <th className="py-2.5 px-3">Variant Name</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3">Expected Flaw</th>
                  <th className="py-2.5 px-3 text-center">Score</th>
                  <th className="py-2.5 px-3 text-center">Similarity</th>
                  <th className="py-2.5 px-3 text-center">Flaws</th>
                  <th className="py-2.5 px-3 text-center">Temporal IoU</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {benchmarkData.results.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">{r.variantName}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {r.gradientLevel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{r.expectedFlaw.replace(/_/g, ' ')}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-cyan-300">{r.overallScore}</td>
                    <td className="py-2.5 px-3 text-center text-slate-400">{r.similarity}%</td>
                    <td className="py-2.5 px-3 text-center text-amber-400">{r.detectedFlawsCount}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          r.temporalIoU >= 0.5
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : r.temporalIoU > 0.05
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {r.temporalIoU.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => handleRunVariant(idx)}
                        disabled={runningVariantIndex === idx}
                        className="px-2.5 py-1 rounded text-[11px] font-sans font-semibold bg-indigo-600/80 hover:bg-indigo-600 text-white transition-colors"
                      >
                        {runningVariantIndex === idx ? 'Loading...' : 'Inspect'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dataset Speech Corpus Baseline */}
      {dataset.map((item) => (
        <div key={item.id} className="space-y-6">
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Speech Corpus Baseline
                </span>
                <h2 className="text-xl font-black text-white tracking-tight mt-1">{item.title}</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold font-mono">
                <CheckCircle2 className="h-4 w-4" />
                <span>Canonical Reference Standard</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                Canonical Transcript:
              </span>
              <p className="text-xs font-serif text-slate-300 italic leading-relaxed">
                "{item.transcript}"
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <FileAudio className="h-4 w-4 text-cyan-400" />
              <span className="truncate">Reference WAV: {item.referenceAudioPath}</span>
            </div>
          </div>

          {/* 10 Gradient Variant Cards */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                <span>Contrastive Gradient Variants ({item.variants.length})</span>
              </h3>
              <span className="text-xs text-slate-400">Click any card to evaluate directly in the dashboard</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {item.variants.map((v, vIdx) => {
                const isRunning = runningVariantIndex === vIdx;

                return (
                  <div
                    key={vIdx}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                            v.severity === 'HIGH'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : v.severity === 'MEDIUM'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {v.severity} SEVERITY
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                          {v.gradientLevel || 'MODERATE'}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-white mb-1.5">{v.variantName}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-3">
                        {v.description}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 mb-3">
                        <div>
                          <span className="text-slate-500 block">Expected Flaw:</span>
                          <span className="text-slate-200 font-semibold">{v.expectedFlaw.replace(/_/g, ' ')}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Interval:</span>
                          <span className="text-slate-200 font-semibold">{v.expectedInterval || 'Whole Speech'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]">
                        {v.filePath.split(/[\\/]/).pop()}
                      </span>
                      <button
                        onClick={() => handleRunVariant(vIdx)}
                        disabled={isRunning}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
                      >
                        {isRunning ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Play className="h-3 w-3 fill-current" />
                        )}
                        <span>Evaluate in Dashboard</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
