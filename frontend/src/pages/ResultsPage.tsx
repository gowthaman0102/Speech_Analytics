import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Printer,
  RotateCcw,
  Sliders,
  AlertTriangle,
  ArrowLeft,
  Percent,
  ShieldCheck,
  Activity,
  Layers,
  ChevronRight,
  MessageSquareQuote,
  Sparkles,
} from 'lucide-react';
import { evaluationApi } from '../api/evaluationApi';
import type { EvaluationDetail, FeatureTimeSeries, FlawSegment } from '../types';
import { ScoreGauge } from '../components/ScoreGauge';
import { WaveformComparison } from '../components/WaveformComparison';
import { FeatureChart } from '../components/FeatureChart';
import { FlawTimeline } from '../components/FlawTimeline';
import { FlawCard } from '../components/FlawCard';
import { RubricCard } from '../components/RubricCard';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { SentenceAnalysisView } from '../components/SentenceAnalysisView';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
      } catch (err: unknown) {
        console.error('Failed to load evaluation:', err);
        setError('Failed to load evaluation results. Please verify the ID or ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleSelectFlaw = useCallback((flaw: FlawSegment) => {
    setSelectedFlaw(flaw);
    setSeekTimestamp(flaw.start);
  }, []);

  const handleSelectFlawById = useCallback((flawId: string) => {
    if (!evaluation) return;
    const found = evaluation.flaws.find((f) => f.id === flawId);
    if (found) {
      handleSelectFlaw(found);
    }
  }, [evaluation, handleSelectFlaw]);

  // Keyboard navigation: [ for prev flaw, ] for next flaw, Esc to clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!evaluation || evaluation.flaws.length === 0) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const currentIndex = selectedFlaw
        ? evaluation.flaws.findIndex((f) => f.id === selectedFlaw.id)
        : -1;

      if (e.key === '[') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : evaluation.flaws.length - 1;
        handleSelectFlaw(evaluation.flaws[prevIndex]);
      } else if (e.key === ']') {
        e.preventDefault();
        const nextIndex = currentIndex < evaluation.flaws.length - 1 ? currentIndex + 1 : 0;
        handleSelectFlaw(evaluation.flaws[nextIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [evaluation, selectedFlaw, handleSelectFlaw]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center">
        <Card className="p-8">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Evaluation Unavailable</h2>
          <p className="text-xs text-[var(--muted-foreground)] mt-2 leading-relaxed">{error}</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="primary" onClick={() => navigate('/evaluate')}>
              Start New Evaluation
            </Button>
            <Button variant="secondary" onClick={() => navigate('/evaluations')}>
              View History
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { summary, configAudit } = evaluation;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Breadcrumb & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <nav className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] mb-1" aria-label="Breadcrumb">
            <Link to="/evaluations" className="hover:text-[var(--foreground)] flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>Evaluations</span>
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="font-mono text-[var(--foreground)]">#{evaluation.evaluationId.slice(0, 8)}</span>
          </nav>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-serif font-bold text-[var(--foreground)] tracking-tight">
              {evaluation.title}
            </h1>
            {evaluation.detectedSpeakingStyle && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-[var(--accent)] text-white flex items-center gap-1 shadow-xs">
                <Sparkles className="w-3 h-3" />
                <span>{evaluation.detectedSpeakingStyle}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Automated semantic intent & temporal speech delivery analysis.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap print:hidden">
          <Button
            variant="ghost"
            onClick={() => setShowAuditConfig(!showAuditConfig)}
            className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showAuditConfig ? 'Hide Audit Config' : 'Audit Config'}</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate('/evaluate')}
            className="flex items-center gap-1.5 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Evaluation</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </Button>
        </div>
      </div>

      {/* Audit Configuration Drawer */}
      {showAuditConfig && configAudit && (
        <Card className="p-5 bg-[var(--surface-2)]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border)]">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
              Active Detection Thresholds & Rubric Configuration
            </h4>
            <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Deterministic Rules Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--muted-foreground)] block">Pacing Tolerance</span>
              <span className="font-semibold text-[var(--foreground)] mt-0.5 block">
                ±{((configAudit.paceThreshold ?? 0.25) * 100).toFixed(0)}% WPM
              </span>
            </div>
            <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--muted-foreground)] block">Pitch Modulation</span>
              <span className="font-semibold text-[var(--foreground)] mt-0.5 block">
                -{((configAudit.pitchVarianceThreshold ?? 0.35) * 100).toFixed(0)}% Spread
              </span>
            </div>
            <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--muted-foreground)] block">Pause Anomaly</span>
              <span className="font-semibold text-[var(--foreground)] mt-0.5 block">
                &gt;{(configAudit.pauseThreshold ?? 0.4).toFixed(2)}s
              </span>
            </div>
            <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--muted-foreground)] block">Energy Delta</span>
              <span className="font-semibold text-[var(--foreground)] mt-0.5 block">
                &gt;{((configAudit.energyThreshold ?? 0.3) * 100).toFixed(0)}% RMS
              </span>
            </div>
            <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--muted-foreground)] block">Min Duration</span>
              <span className="font-semibold text-[var(--foreground)] mt-0.5 block">
                {(configAudit.minFlawDurationSec ?? 0.4).toFixed(2)}s
              </span>
            </div>
            <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--border)]">
              <span className="text-[10px] text-[var(--muted-foreground)] block">Merge Gap</span>
              <span className="font-semibold text-[var(--foreground)] mt-0.5 block">
                {(configAudit.flawMergeGapSec ?? 0.5).toFixed(2)}s
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Score Card */}
        <Card className="p-5 flex flex-col items-center justify-center">
          <ScoreGauge score={summary.overallScore} label="Overall Delivery Score" size="lg" />
        </Card>

        {/* 3 Key Analytical Pillars */}
        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Baseline Similarity
            </span>
            <Percent className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="my-3">
            <span className="text-3xl font-serif font-bold text-[var(--foreground)]">
              {summary.similarity}%
            </span>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Cross-correlation across DTW-aligned acoustic trajectories.
            </p>
          </div>
          <div className="w-full bg-[var(--surface-2)] h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#1F4E79] h-full rounded-full" style={{ width: `${summary.similarity}%` }} />
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Grounding Confidence
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="my-3">
            <span className="text-3xl font-serif font-bold text-[var(--foreground)]">
              {summary.confidence}%
            </span>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Lexical word alignment density and token timestamp fidelity.
            </p>
          </div>
          <div className="w-full bg-[var(--surface-2)] h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-700 h-full rounded-full" style={{ width: `${summary.confidence}%` }} />
          </div>
        </Card>

        <Card className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Delivery Flaws
            </span>
            <Activity className="w-4 h-4 text-[var(--series-participant)]" />
          </div>
          <div className="my-3">
            <span className="text-3xl font-serif font-bold text-[var(--foreground)]">
              {evaluation.flaws.length}
            </span>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Distinct temporal segments with statistically significant deviation.
            </p>
          </div>
          <div className="text-xs text-[var(--muted-foreground)] font-mono">
            {evaluation.flaws.filter((f) => f.severity === 'HIGH').length} High •{' '}
            {evaluation.flaws.filter((f) => f.severity === 'MEDIUM').length} Medium
          </div>
        </Card>
      </div>

      {/* Executive Diagnostic Callout */}
      {evaluation.summaryText && (
        <Card className="p-5 border-l-4 border-l-[var(--accent)] bg-[var(--surface-2)]">
          <div className="flex items-start gap-3.5">
            <MessageSquareQuote className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  Executive Oratorical Diagnostic
                </h4>
                {evaluation.detectedSpeakingStyle && (
                  <span className="text-[11px] font-mono text-[var(--muted-foreground)]">
                    Profile: {evaluation.detectedSpeakingStyle}
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--foreground)] leading-relaxed">
                {evaluation.summaryText}
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-[var(--muted-foreground)] pt-1">
                <span>Strongest: <strong className="text-emerald-700 dark:text-emerald-400">{summary.strongestArea}</strong></span>
                <span>•</span>
                <span>Focus Area: <strong className="text-rose-700 dark:text-rose-400">{summary.weakestArea}</strong></span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Waveform Player Section */}
      <section aria-label="Waveform comparison">
        <WaveformComparison
          referenceAudioUrl={evaluation.referenceAudioUrl}
          participantAudioUrl={evaluation.participantAudioUrl}
          flaws={evaluation.flaws}
          selectedFlawId={selectedFlaw?.id}
          onSelectFlaw={handleSelectFlawById}
          seekTime={seekTimestamp}
        />
      </section>

      {/* Sentence-Level Semantic Analysis */}
      {evaluation.sentences && evaluation.sentences.length > 0 && (
        <section aria-label="Sentence analysis">
          <SentenceAnalysisView
            sentences={evaluation.sentences}
            onSeekTime={(t) => setSeekTimestamp(t)}
            activeTime={seekTimestamp}
          />
        </section>
      )}

      {/* Two-Pane Flaw Explorer */}
      <section aria-label="Flaw inspector" className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-semibold text-[var(--foreground)]">
            Temporal Flaw Diagnostics & Coaching
          </h2>
          <span className="text-xs text-[var(--muted-foreground)] hidden sm:inline">
            Use <kbd className="px-1 rounded bg-[var(--surface-2)] border text-[10px] font-mono">[</kbd> and <kbd className="px-1 rounded bg-[var(--surface-2)] border text-[10px] font-mono">]</kbd> keys to cycle flaws
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5">
            <FlawTimeline
              flaws={evaluation.flaws}
              selectedFlawId={selectedFlaw?.id}
              onSelectFlaw={handleSelectFlaw}
            />
          </div>

          <div className="lg:col-span-7">
            {selectedFlaw ? (
              <FlawCard
                flaw={selectedFlaw}
                onPlayTimestamp={(t) => setSeekTimestamp(t)}
                isFocused={true}
              />
            ) : (
              <Card className="p-8 text-center text-xs text-[var(--muted-foreground)]">
                Select a flaw from the index to review its causal acoustic measurements and coaching guidance.
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Acoustic Trajectory Chart */}
      {features && (
        <section aria-label="Acoustic curves">
          <FeatureChart
            data={features}
            selectedFlawTime={selectedFlaw ? { start: selectedFlaw.start, end: selectedFlaw.end } : null}
          />
        </section>
      )}

      {/* Rubric Breakdown */}
      {(evaluation.rubricDetails?.length > 0 || (evaluation.rubricScores && evaluation.rubricScores.length > 0)) && (
        <section aria-label="Rubric scoring">
          <RubricCard rubricDetails={evaluation.rubricDetails || evaluation.rubricScores || []} />
        </section>
      )}

      {/* Grounded Transcript */}
      {evaluation.transcript && (
        <section aria-label="Transcript viewer">
          <TranscriptViewer
            transcript={evaluation.transcript}
            flaws={evaluation.flaws}
            alignmentWords={evaluation.alignmentWords}
            onSelectFlaw={handleSelectFlaw}
            onSeekTime={(t) => setSeekTimestamp(t)}
            selectedFlawId={selectedFlaw?.id}
          />
        </section>
      )}
    </div>
  );
};
