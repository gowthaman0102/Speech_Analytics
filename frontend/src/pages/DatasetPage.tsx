import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Play, Sparkles, Layers, FileAudio, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { evaluationApi } from '../api/evaluationApi';
import { DatasetItem, DatasetVariant } from '../types';

export const DatasetPage: React.FC = () => {
  const navigate = useNavigate();
  const [dataset, setDataset] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [runningVariant, setRunningVariant] = useState<string | null>(null);

  useEffect(() => {
    evaluationApi.getDataset()
      .then((data) => setDataset(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleTestVariant = async (variant: DatasetVariant) => {
    setRunningVariant(variant.variantName);
    try {
      // Start demo evaluation
      const res = await evaluationApi.startDemoEvaluation();
      navigate(`/results/${res.evaluationId}`);
    } catch (e) {
      console.error(e);
      setRunningVariant(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 text-cyan-400 animate-spin mb-4" />
        <h3 className="text-xl font-bold text-white tracking-tight">Loading Contrastive Dataset</h3>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-400" />
            <h1 className="text-3xl font-black text-white tracking-tight">Contrastive Dataset Explorer</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Pre-packaged speech baseline audio and synthetically flawed test variants across the severity gradient
          </p>
        </div>

        <button
          onClick={() => evaluationApi.startDemoEvaluation().then((r) => navigate(`/results/${r.evaluationId}`))}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all"
        >
          <Sparkles className="h-4 w-4" />
          <span>Run Standard Demo</span>
        </button>
      </div>

      {dataset.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
          No dataset files found. Please ensure demo files are built.
        </div>
      ) : (
        dataset.map((item) => (
          <div key={item.id} className="space-y-6">
            {/* Speech Info Card */}
            <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Speech Corpus Baseline
                  </span>
                  <h2 className="text-xl font-black text-white tracking-tight mt-1">{item.title}</h2>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Ground Truth Validated</span>
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
                <span className="truncate">Reference Path: {item.referenceAudioPath}</span>
              </div>
            </div>

            {/* Flawed Variants Matrix */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Layers className="h-4 w-4 text-cyan-400" />
                  <span>Contrastive Flaw Variants ({item.variants.length})</span>
                </h3>
                <span className="text-xs text-slate-400">Ranging from almost perfect to severe flaws</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {item.variants.map((v, vIdx) => {
                  const isRunning = runningVariant === v.variantName;

                  return (
                    <div
                      key={vIdx}
                      className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between shadow-lg"
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
                          <span className="text-[10px] font-mono text-slate-500">
                            {v.expectedFlaw.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-white mb-1.5">{v.variantName}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                          {v.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500 truncate max-w-[140px]">
                          {v.filePath.split(/[\\/]/).pop()}
                        </span>
                        <button
                          onClick={() => handleTestVariant(v)}
                          disabled={isRunning}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors disabled:opacity-50"
                        >
                          {isRunning ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3 fill-current" />
                          )}
                          <span>Evaluate</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
