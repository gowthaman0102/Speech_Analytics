import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Percent,
  AlertTriangle,
  Award,
  TrendingDown,
  RotateCcw,
  Download,
  Info,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Loader2,
} from 'lucide-react';
import { evaluationApi } from '../api/evaluationApi';
import { EvaluationDetail, FeatureTimeSeries, FlawSegment } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import { WaveformComparison } from '../components/WaveformComparison';
import { FeatureChart } from '../components/FeatureChart';
import { FlawTimeline } from '../components/FlawTimeline';
import { FlawCard } from '../components/FlawCard';
import { RubricCard } from '../components/RubricCard';
import { TranscriptViewer } from '../components/TranscriptViewer';

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [features, setFeatures] = useState<FeatureTimeSeries | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFlaw, setSelectedFlaw] = useState<FlawSegment | null>(null);
  const [seekTimestamp, setSeekTimestamp] = useState<number | null>(null);
  const [showAuditConfig, setShowAuditConfig] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [evalData, featData] = await Promise.all([
          evaluationApi.getEvaluationResults(id),
          evaluationApi.getEvaluationFeatures(id),
        ]);
        setEvaluation(evalData);
        setFeatures(featData);
        if (evalData.flaws.length > 0) {
          setSelectedFlaw(evalData.flaws[0]);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load evaluation results.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleSelectFlaw = (flaw: FlawSegment) => {
    setSelectedFlaw(flaw);
    setSeekTimestamp(flaw.start);
  };

  const handleSelectFlawById = (flawId: string) => {
    const f = evaluation?.flaws.find((item) => item.id === flawId);
    if (f) {
      handleSelectFlaw(f);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-10 w-10 text-cyan-400 animate-spin mb-4" />
        <h3 className="text-xl font-bold text-white tracking-tight">Compiling Temporal Speech Analytics</h3>
        <p className="text-sm text-slate-400 mt-1">
          Synchronizing aligned audio timelines, feature trajectories, and rubric scores...
        </p>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
        <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Evaluation Error</h3>
        <p className="text-sm text-slate-400 mt-2">{error || 'Evaluation could not be found.'}</p>
        <Link
          to="/evaluate"
          className="inline-block mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs"
        >
          Return to Evaluations
        </Link>
      </div>
    );
  }

  const { summary, configAudit, groundTruthValidation } = evaluation;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Temporal Contrastive Evaluation
            </span>
            <span className="text-xs text-slate-500 font-mono">ID: {evaluation.evaluationId.slice(0, 8)}</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1.5">{evaluation.title}</h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowAuditConfig(!showAuditConfig)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 transition-colors"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{showAuditConfig ? 'Hide Audit Settings' : 'Audit Settings'}</span>
          </button>
          <Link
            to="/evaluate"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>New Evaluation</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Reference-Relative Delivery Analysis Banner */}
      <div className="bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-slate-900 border border-cyan-500/30 rounded-2xl p-4 flex items-start sm:items-center gap-3">
        <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5 sm:mt-0" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <span className="font-bold text-white">Reference-Relative Contrastive Delivery Analysis Active: </span>
          Scores and temporal flaws are evaluated against a verified baseline delivery of the exact same transcript.
          Deviations are temporally anchored with sub-second timestamps and causal acoustic differences.
        </div>
      </div>

      {/* Config Audit Panel (Collapsible) */}
      {showAuditConfig && configAudit && (
        <div className="bg-slate-900/90 rounded-2xl border border-cyan-500/30 p-5 animate-fadeIn shadow-xl">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Active Thresholds & Rubric Configuration Audit
              </h4>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Deterministic Rules Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs font-mono">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Pace Threshold</span>
              <span className="font-bold text-cyan-300 mt-0.5 block">
                ±{(configAudit.paceThreshold * 100).toFixed(0)}% WPM
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Pitch Var Threshold</span>
              <span className="font-bold text-cyan-300 mt-0.5 block">
                -{(configAudit.pitchVarianceThreshold * 100).toFixed(0)}% Spread
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Pause Mismatch</span>
              <span className="font-bold text-cyan-300 mt-0.5 block">
                &gt;{configAudit.pauseThreshold.toFixed(2)}s
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Energy Delta</span>
              <span className="font-bold text-cyan-300 mt-0.5 block">
                &gt;{(configAudit.energyThreshold * 100).toFixed(0)}% RMS
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Min Flaw Window</span>
              <span className="font-bold text-cyan-300 mt-0.5 block">
                {configAudit.minFlawDurationSec.toFixed(2)}s
              </span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Merge Gap</span>
              <span className="font-bold text-cyan-300 mt-0.5 block">
                {configAudit.flawMergeGapSec.toFixed(2)}s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Score */}
        <div className="md:col-span-1 bg-slate-900/90 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col items-center justify-center text-center">
          <ScoreGauge score={summary.overallScore} label="Overall Score" size="lg" />
        </div>

        {/* 3 Metric Summary Pillars */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Baseline Similarity */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Reference Similarity</span>
              <Percent className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="my-3">
              <span className="text-3xl font-black text-white font-mono">{summary.similarity}%</span>
              <p className="text-xs text-slate-400 mt-1">Acoustic profile match across DTW-aligned feature vectors</p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${summary.similarity}%` }} />
            </div>
          </div>

          {/* Confidence Score */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Grounding Confidence</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="my-3">
              <span className="text-3xl font-black text-white font-mono">{summary.confidence}%</span>
              <p className="text-xs text-slate-400 mt-1">Certainty from lexical alignment coverage and pitch spread</p>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${summary.confidence}%` }} />
            </div>
          </div>

          {/* Flaw Count & Diagnostic Pillars */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Diagnostic Summary</span>
              <AlertTriangle className="h-4 w-4 text-amber-400" />
            </div>
            <div className="space-y-2 my-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Detected Flaw Regions:</span>
                <span className="font-bold font-mono text-white text-sm">{summary.totalFlaws}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Strongest Area:</span>
                <span className="font-bold text-emerald-400">{summary.strongestArea}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Needs Work:</span>
                <span className="font-bold text-rose-400">{summary.weakestArea}</span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono truncate">Deterministic signal analysis</div>
          </div>
        </div>
      </div>

      {/* Ground Truth Expected-vs-Detected Validation Table (If available) */}
      {groundTruthValidation && (
        <div className="bg-slate-900/90 rounded-2xl border border-emerald-500/30 p-6 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Ground-Truth Validation & Temporal IoU Benchmark
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates detected temporal flaw intervals against official human-annotated ground-truth targets.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded">
                Detection Rate: {groundTruthValidation.detectionRatePct}%
              </span>
              <span className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded">
                Avg IoU: {groundTruthValidation.averageTemporalIoU}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] font-mono tracking-wider">
                  <th className="py-2.5 px-3">Expected Flaw</th>
                  <th className="py-2.5 px-3">Expected Interval</th>
                  <th className="py-2.5 px-3">Detected Flaw</th>
                  <th className="py-2.5 px-3">Detected Interval</th>
                  <th className="py-2.5 px-3 text-center">Temporal IoU</th>
                  <th className="py-2.5 px-3 text-center">Start Err</th>
                  <th className="py-2.5 px-3 text-center">End Err</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {groundTruthValidation.validationDetails.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">{item.expectedType.replace(/_/g, ' ')}</td>
                    <td className="py-2.5 px-3 text-slate-400">{item.expectedInterval}</td>
                    <td className="py-2.5 px-3 text-cyan-300">{item.detectedType.replace(/_/g, ' ')}</td>
                    <td className="py-2.5 px-3 text-slate-400">{item.detectedInterval}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          item.temporalIoU >= 0.5
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : item.temporalIoU > 0.15
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.temporalIoU.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400">
                      {item.startTimeErrorSec > 0 ? `${item.startTimeErrorSec}s` : '0.0s'}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400">
                      {item.endTimeErrorSec > 0 ? `${item.endTimeErrorSec}s` : '0.0s'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {item.status === 'DETECTED' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" /> MATCHED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          <XCircle className="h-3 w-3" /> MISSED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Waveform Comparison Section */}
      <WaveformComparison
        referenceAudioUrl={evaluation.referenceAudioUrl}
        participantAudioUrl={evaluation.participantAudioUrl}
        flaws={evaluation.flaws}
        selectedFlawId={selectedFlaw?.id}
        onSelectFlaw={handleSelectFlawById}
        seekTime={seekTimestamp}
      />

      {/* Acoustic Feature Chart */}
      {features && (
        <FeatureChart
          data={features}
          selectedFlawTime={selectedFlaw ? { start: selectedFlaw.start, end: selectedFlaw.end } : null}
        />
      )}

      {/* Main Flaw Inspection Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <FlawTimeline
            flaws={evaluation.flaws}
            selectedFlawId={selectedFlaw?.id}
            onSelectFlaw={handleSelectFlaw}
          />
        </div>

        <div className="lg:col-span-2">
          {selectedFlaw ? (
            <FlawCard
              flaw={selectedFlaw}
              onPlayTimestamp={(t) => setSeekTimestamp(t)}
              isFocused={true}
              onSelect={handleSelectFlaw}
            />
          ) : (
            <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400">
              Select an event from the timeline to view causal explanations
            </div>
          )}
        </div>
      </div>

      {/* Rubric Breakdown Grid */}
      <RubricCard rubricDetails={evaluation.rubricDetails} />

      {/* Transcript Analysis with Word-level seeking */}
      <TranscriptViewer
        transcript={evaluation.transcript}
        flaws={evaluation.flaws}
        alignmentWords={evaluation.alignmentWords}
        onSelectFlaw={handleSelectFlaw}
        onSeekTime={(t) => setSeekTimestamp(t)}
        selectedFlawId={selectedFlaw?.id}
      />
    </div>
  );
};
