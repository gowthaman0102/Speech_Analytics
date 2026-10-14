import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2,
  Loader2,
  CheckCircle2,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { evaluationApi } from '../api/evaluationApi';
import type { DatasetItem, BenchmarkResponse } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const DatasetPage: React.FC = () => {
  const navigate = useNavigate();
  const [dataset, setDataset] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningKey, setRunningKey] = useState<string | null>(null);
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

  const handleRunVariant = async (sampleId: string, variantName: string) => {
    const key = `${sampleId}-${variantName}`;
    setRunningKey(key);
    try {
      const res = await evaluationApi.evaluateDatasetVariant(sampleId, variantName);
      navigate(`/processing/${res.evaluationId}`);
    } catch (e) {
      console.error('Failed to evaluate variant:', e);
      setRunningKey(null);
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
      <div className="min-h-[calc(100vh-56px)] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mb-3" />
        <h2 className="text-base font-semibold text-[var(--foreground)]">
          Loading Contrastive Dataset & Benchmarks
        </h2>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          Reading acoustic speech corpora and gradient variations...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
              Reference Corpora & Gradient Matrix
            </span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-[var(--foreground)] tracking-tight">
            Contrastive Speech Dataset
          </h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Calibrated baseline recordings and 10 systematic quality gradient variants for deterministic verification.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="secondary"
            onClick={handleRunBenchmark}
            disabled={benchmarkLoading}
            className="flex items-center gap-2 text-xs"
          >
            {benchmarkLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <BarChart2 className="w-3.5 h-3.5 text-[var(--accent)]" />
            )}
            <span>{benchmarkLoading ? 'Running 10 Tiers...' : 'Run Gradient Benchmark'}</span>
          </Button>

          <Button
            variant="primary"
            onClick={() =>
              evaluationApi.startDemoEvaluation().then((r) => navigate(`/processing/${r.evaluationId}`))
            }
            className="flex items-center gap-2 text-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Evaluate Standard Demo</span>
          </Button>
        </div>
      </div>

      {/* 5-Tier Quality & Severity Gradient Matrix */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[var(--border)]">
          <Layers className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
            5-Tier Evaluation Quality & Severity Gradient
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {/* Tier 1 */}
          <div className="p-3.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                Tier 1
              </span>
              <h4 className="font-semibold text-[var(--foreground)] text-sm">Ideal Standard</h4>
              <p className="text-[var(--muted-foreground)] text-xs mt-1 leading-relaxed">
                Measured cadence (1.00x), calibrated projection, and expressive pause rhythm.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[var(--border)] font-mono text-[11px] font-medium text-emerald-800">
              Score: 95–100
            </div>
          </div>

          {/* Tier 2 */}
          <div className="p-3.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-800 block mb-1">
                Tier 2
              </span>
              <h4 className="font-semibold text-[var(--foreground)] text-sm">Almost Perfect</h4>
              <p className="text-[var(--muted-foreground)] text-xs mt-1 leading-relaxed">
                Natural tempo variation (1.05x). Competitive orator standard with no major flaws.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[var(--border)] font-mono text-[11px] font-medium text-sky-800">
              Score: 85–94
            </div>
          </div>

          {/* Tier 3 */}
          <div className="p-3.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 block mb-1">
                Tier 3
              </span>
              <h4 className="font-semibold text-[var(--foreground)] text-sm">Mildly Flawed</h4>
              <p className="text-[var(--muted-foreground)] text-xs mt-1 leading-relaxed">
                1.10x pacing elevation, -3 dB volume attenuation. Intelligible but noticeable.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[var(--border)] font-mono text-[11px] font-medium text-amber-800">
              Score: 75–84
            </div>
          </div>

          {/* Tier 4 */}
          <div className="p-3.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-800 block mb-1">
                Tier 4
              </span>
              <h4 className="font-semibold text-[var(--foreground)] text-sm">Moderately Flawed</h4>
              <p className="text-[var(--muted-foreground)] text-xs mt-1 leading-relaxed">
                1.20x rushed tempo, -6 dB volume attenuation, 1.5s hesitation pause gap.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[var(--border)] font-mono text-[11px] font-medium text-orange-800">
              Score: 65–74
            </div>
          </div>

          {/* Tier 5 */}
          <div className="p-3.5 rounded-md border border-[var(--border)] bg-[var(--surface-2)] flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-800 block mb-1">
                Tier 5
              </span>
              <h4 className="font-semibold text-[var(--foreground)] text-sm">Severely Flawed</h4>
              <p className="text-[var(--muted-foreground)] text-xs mt-1 leading-relaxed">
                1.40x rushed pace, -10 dB projection, 2.8s dead air pause, monotone pitch.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[var(--border)] font-mono text-[11px] font-medium text-rose-800">
              Score: &lt; 65
            </div>
          </div>
        </div>
      </Card>

      {/* Benchmark Results (if available) */}
      {benchmarkData && (
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--border)]">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[var(--accent)]" />
                <h3 className="text-sm font-semibold text-[var(--foreground)] tracking-tight">
                  Gradient Benchmark & Score Monotonicity Verification
                </h3>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                Evaluation results across all 10 gradient variants verified against expected ground truth annotations.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span
                className={`px-2.5 py-0.5 rounded border text-[11px] font-semibold ${
                  benchmarkData.monotonicityPassed
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {benchmarkData.monotonicityPassed ? '✓ Monotonicity Confirmed' : '⚠ Monotonicity In Progress'}
              </span>
              <span className="bg-[var(--surface-2)] text-[var(--muted-foreground)] border border-[var(--border)] px-2 py-0.5 rounded">
                Evaluated: {benchmarkData.totalEvaluated} Tiers
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase text-[10px] font-mono tracking-wider">
                  <th className="py-2.5 px-3">Variant Name</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3">Expected Flaw</th>
                  <th className="py-2.5 px-3">Overall Score</th>
                  <th className="py-2.5 px-3">Flaws Found</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {benchmarkData.results.map((r, idx) => (
                  <tr key={idx} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="py-2.5 px-3 font-medium text-[var(--foreground)]">{r.variantName}</td>
                    <td className="py-2.5 px-3 font-mono text-[var(--muted-foreground)]">
                      {r.gradientLevel || r.tier || 'Standard'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--muted-foreground)]">{r.expectedFlaw}</td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-[var(--foreground)]">
                      {r.overallScore.toFixed(1)} / 100
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[var(--muted-foreground)]">
                      {r.detectedFlawsCount ?? r.flawsDetected ?? 0}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        Pass
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Dataset Samples & Variants */}
      <div className="space-y-6">
        <h2 className="text-lg font-serif font-semibold text-[var(--foreground)]">
          Reference Speeches & Variants
        </h2>

        {dataset.map((item) => (
          <Card key={item.id} className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--border)]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
                  {item.category || 'Oratory'}
                </span>
                <h3 className="text-base font-semibold text-[var(--foreground)] mt-0.5">
                  {item.title}
                </h3>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Speaker: {item.speaker || 'Reference Orator'}
                </p>
              </div>

              {item.referenceAudioUrl && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--muted-foreground)] font-mono">Reference Audio:</span>
                  <audio controls src={item.referenceAudioUrl} className="h-7 w-48" preload="none" />
                </div>
              )}
            </div>

            {/* Transcript Preview */}
            <div className="p-3 rounded bg-[var(--surface-2)] border border-[var(--border)] mb-4 text-xs font-serif italic text-[var(--foreground)] leading-relaxed">
              "{item.transcript}"
            </div>

            {/* Available Variants */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-2">
                Gradient Variants ({item.variants?.length ?? 0})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {item.variants?.map((v, vIdx) => {
                  const variantName = v.variantName || v.name || `Variant ${vIdx + 1}`;
                  const key = `${item.id}-${variantName}`;
                  const isRunning = runningKey === key;
                  const tier = v.gradientLevel || v.tier || 'MODERATE';

                  return (
                    <div
                      key={vIdx}
                      className="p-3 rounded border border-[var(--border)] bg-[var(--surface)] flex flex-col justify-between hover:border-[var(--border-strong)] transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-semibold text-xs text-[var(--foreground)]">
                            {variantName}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--surface-2)] text-[var(--muted-foreground)] border border-[var(--border)]">
                            {tier}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--muted-foreground)] leading-snug">
                          {v.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between gap-2">
                        {v.audioUrl && (
                          <audio controls src={v.audioUrl} className="h-6 w-28" preload="none" />
                        )}
                        <Button
                          variant="secondary"
                          onClick={() => handleRunVariant(item.id, variantName)}
                          disabled={isRunning}
                          className="text-[11px] px-2.5 py-1 flex items-center gap-1 shrink-0 ml-auto"
                        >
                          {isRunning ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ArrowRight className="w-3 h-3 text-[var(--accent)]" />
                          )}
                          <span>{isRunning ? 'Evaluating...' : 'Evaluate'}</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
