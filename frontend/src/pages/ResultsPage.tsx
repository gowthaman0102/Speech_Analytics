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
  Share2,
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
        <h3 className="text-xl font-bold text-white tracking-tight">Compiling Speech Analytics</h3>
        <p className="text-sm text-slate-400 mt-1">Retrieving synchronized timelines, features, and rubric scores...</p>
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

  const { summary } = evaluation;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Evaluation Completed
            </span>
            <span className="text-xs text-slate-500 font-mono">ID: {evaluation.evaluationId.slice(0, 8)}</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mt-1.5">{evaluation.title}</h1>
        </div>

        <div className="flex items-center gap-3">
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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Evaluation Confidence</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="my-3">
              <span className="text-3xl font-black text-white font-mono">{summary.confidence}%</span>
              <p className="text-xs text-slate-400 mt-1">Grounding certainty from lexical alignment and pitch coverage</p>
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
                <span className="text-slate-400">Total Flaw Regions:</span>
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

      {/* Transcript Analysis */}
      <TranscriptViewer
        transcript={evaluation.transcript}
        flaws={evaluation.flaws}
        onSelectFlaw={handleSelectFlaw}
        selectedFlawId={selectedFlaw?.id}
      />
    </div>
  );
};
