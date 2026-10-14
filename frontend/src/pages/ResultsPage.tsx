import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Printer,
  RotateCcw,
  AlertTriangle,
  Layers,
  ChevronRight,
  MessageSquareQuote,
  Sparkles,
  Gauge,
  HeartHandshake,
} from 'lucide-react';
import { evaluationApi } from '../api/evaluationApi';
import type { EvaluationDetail, FeatureTimeSeries, FlawSegment, PlaybackRequest } from '../types';
import { WaveformComparison } from '../components/WaveformComparison';
import { FeatureChart } from '../components/FeatureChart';
import { RubricCard } from '../components/RubricCard';
import { TranscriptViewer } from '../components/TranscriptViewer';
import { SentenceAnalysisView } from '../components/SentenceAnalysisView';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [evaluation, setEvaluation] = useState<EvaluationDetail | null>(null);
  const [features, setFeatures] = useState<FeatureTimeSeries | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFlaw, setSelectedFlaw] = useState<FlawSegment | null>(null);

  // Synchronized playback state shared across all components
  const [playbackRequest, setPlaybackRequest] = useState<PlaybackRequest | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

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

  const handlePlaySentence = useCallback((start: number, end?: number) => {
    setPlaybackRequest({
      start,
      end,
      playImmediately: true,
      requestId: Date.now(),
    });
  }, []);

  const handlePause = useCallback(() => {
    setPlaybackRequest({
      start: currentTime,
      playImmediately: false,
      requestId: Date.now(),
    });
  }, [currentTime]);

  const handleSeek = useCallback((time: number, end?: number) => {
    setPlaybackRequest({
      start: time,
      end,
      playImmediately: true,
      requestId: Date.now(),
    });
  }, []);

  const handleSelectFlaw = useCallback((flaw: FlawSegment) => {
    setSelectedFlaw(flaw);
    handleSeek(flaw.start, flaw.end);
  }, [handleSeek]);

  const handleSelectFlawById = useCallback((flawId: string) => {
    if (!evaluation) return;
    const found = evaluation.flaws.find((f) => f.id === flawId);
    if (found) {
      handleSelectFlaw(found);
    }
  }, [evaluation, handleSelectFlaw]);

  // Keyboard navigation: [ for prev flaw, ] for next flaw
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
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 text-center">
        <Card className="p-8">
          <AlertTriangle className="w-10 h-10 text-danger mx-auto mb-3" />
          <h2 className="text-lg font-bold text-text">Evaluation unavailable</h2>
          <p className="text-xs text-text-muted mt-2 leading-relaxed">{error}</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="primary" onClick={() => navigate('/evaluate')}>
              New evaluation
            </Button>
            <Button variant="secondary" onClick={() => navigate('/evaluations')}>
              View history
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { summary } = evaluation;

  // Derived speaker-friendly coaching metrics
  const sentencesList = evaluation.sentences || [];

  const wpms = sentencesList
    .map((s) => s.actual_prosody?.speech_rate_wpm)
    .filter((w): w is number => typeof w === 'number' && w > 0);

  const totalWords = evaluation.transcript
    ? evaluation.transcript.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const durationMin = (evaluation.participantDuration || 0) / 60;
  const fallbackWpm = durationMin > 0 && totalWords > 0 ? Math.round(totalWords / durationMin) : 145;

  const avgWpm = wpms.length > 0
    ? Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length)
    : fallbackWpm;

  const paceLabel = avgWpm > 165 ? 'Brisk tempo' : avgWpm < 125 ? 'Deliberate tempo' : 'Optimal pace';
  const paceBadgeVariant = avgWpm > 165 ? 'warning' : avgWpm < 125 ? 'default' : 'success';

  // Semantic intent and emotional tone match
  const compScores = sentencesList
    .map((s) => s.compatibility_score)
    .filter((c): c is number => typeof c === 'number' && !isNaN(c));

  const toneMatchPct = compScores.length > 0
    ? Math.round(compScores.reduce((a, b) => a + b, 0) / compScores.length)
    : Math.round(summary.similarity || 65);

  const sentenceCount = sentencesList.length > 0
    ? sentencesList.length
    : (evaluation.transcript ? evaluation.transcript.split(/[.!?]+/).filter((s) => s.trim().length > 0).length : 1);
  const speechDurationSec = Math.round(evaluation.participantDuration || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 text-left">
      {/* Breadcrumb & Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <nav className="flex items-center gap-2 text-xs text-text-muted mb-1.5" aria-label="Breadcrumb">
            <Link to="/evaluations" className="hover:text-text flex items-center gap-1 font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Evaluations</span>
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-text font-bold">Report details</span>
          </nav>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              {evaluation.title}
            </h1>
            {evaluation.detectedSpeakingStyle && (
              <Badge variant="accent" size="sm">
                <Sparkles className="w-3 h-3 mr-1" />
                <span>{evaluation.detectedSpeakingStyle}</span>
              </Badge>
            )}
          </div>
          <p className="text-xs text-text-muted mt-1">
            Speech delivery assessment across vocal melody, rhythm cadence, and energy projection.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap print:hidden">
          <Button
            variant="secondary"
            onClick={() => navigate('/evaluate')}
            className="flex items-center gap-1.5 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New evaluation</span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print report</span>
          </Button>
        </div>
      </div>

      {/* Top Stat Row: Solid Terracotta Overall Score Tile + 3 Plain-Language Coaching Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Score Tile: Solid Terracotta Background */}
        <div className="p-6 rounded-2xl bg-accent text-white flex flex-col justify-between shadow-[0_1px_0_rgba(120,80,40,0.08)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white/90">
              Overall delivery score
            </span>
            <Sparkles className="w-4 h-4 text-white/80" />
          </div>
          <div className="my-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight tabular-nums">
                {Math.round(summary.overallScore)}
              </span>
              <span className="text-base font-bold text-white/80">/ 100</span>
            </div>
            <p className="text-xs text-white/80 mt-1 leading-normal">
              Composite delivery score across vocal dynamics and expressive intent.
            </p>
          </div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.round(summary.overallScore)}%` }}
            />
          </div>
        </div>

        {/* Card 2: Speaking Pace */}
        <Card className="p-6 flex flex-col justify-between text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted">
              Speaking pace
            </span>
            <Gauge className="w-4 h-4 text-teal" />
          </div>
          <div className="my-4">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-extrabold text-text tabular-nums">
                {avgWpm}
              </span>
              <span className="text-xs font-bold text-text-muted">WPM</span>
              <Badge variant={paceBadgeVariant} size="sm">
                {paceLabel}
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-1.5 leading-normal">
              Average words per minute across phrases (recommended range: 135–155 WPM).
            </p>
          </div>
          <div className="w-full bg-surface-2 h-2 rounded-full overflow-hidden border border-border">
            <div
              className="bg-teal h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((avgWpm / 220) * 100))}%` }}
            />
          </div>
        </Card>

        {/* Card 3: Tone & Emotional Match */}
        <Card className="p-6 flex flex-col justify-between text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted">
              Tone & intent match
            </span>
            <HeartHandshake className="w-4 h-4 text-accent" />
          </div>
          <div className="my-4">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-extrabold text-text tabular-nums">
                {toneMatchPct}%
              </span>
              {evaluation.detectedSpeakingStyle && (
                <Badge variant="teal" size="sm">
                  {evaluation.detectedSpeakingStyle}
                </Badge>
              )}
            </div>
            <p className="text-xs text-text-muted mt-1.5 leading-normal">
              How naturally vocal energy and pitch modulation matched each sentence's meaning.
            </p>
          </div>
          <div className="w-full bg-surface-2 h-2 rounded-full overflow-hidden border border-border">
            <div
              className="bg-accent h-full rounded-full transition-all duration-500"
              style={{ width: `${toneMatchPct}%` }}
            />
          </div>
        </Card>

        {/* Card 4: Flow & Structure */}
        <Card className="p-6 flex flex-col justify-between text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-text-muted">
              Speech structure & flow
            </span>
            <Layers className="w-4 h-4 text-text" />
          </div>
          <div className="my-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-text tabular-nums">
                {sentenceCount}
              </span>
              <span className="text-xs font-bold text-text-muted">Thought groups</span>
            </div>
            <p className="text-xs text-text-muted mt-1.5 leading-normal">
              {totalWords > 0 ? `${totalWords} words spoken across ` : ''}
              {speechDurationSec}s total duration.
            </p>
          </div>
          <div className="text-xs font-semibold text-text-muted flex items-center justify-between pt-1 border-t border-border/60">
            <span>Focus area:</span>
            <strong className="text-accent">{summary.weakestArea || 'Pitch Modulation'}</strong>
          </div>
        </Card>
      </div>

      {/* Coach Diagnostic Callout */}
      {evaluation.summaryText && (
        <Card className="p-6 border-l-4 border-l-accent bg-surface-2 shadow-xs">
          <div className="flex items-start gap-3.5">
            <MessageSquareQuote className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-text">
                  Coach's summary note
                </h4>
                {evaluation.detectedSpeakingStyle && (
                  <span className="text-xs font-semibold text-text-muted">
                    Style: {evaluation.detectedSpeakingStyle}
                  </span>
                )}
              </div>
              <p className="text-sm text-text leading-relaxed font-medium">
                {evaluation.summaryText}
              </p>
              <div className="flex items-center gap-4 text-xs font-semibold text-text-muted pt-1">
                <span>Strongest area: <strong className="text-success">{summary.strongestArea}</strong></span>
                <span>•</span>
                <span>Focus area: <strong className="text-danger">{summary.weakestArea}</strong></span>
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
          playbackRequest={playbackRequest}
          onTimeUpdate={(t) => setCurrentTime(t)}
          onPlayStateChange={(p) => setIsPlaying(p)}
        />
      </section>

      {/* Sentence-Level Semantic Analysis */}
      {evaluation.sentences && evaluation.sentences.length > 0 && (
        <section aria-label="Sentence analysis">
          <SentenceAnalysisView
            sentences={evaluation.sentences}
            onPlaySentence={handlePlaySentence}
            onPause={handlePause}
            onSeekTime={handleSeek}
            currentTime={currentTime}
            isPlaying={isPlaying}
          />
        </section>
      )}


      {/* Delivery Curves Chart */}
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
            onSeekTime={(t) => handleSeek(t)}
            selectedFlawId={selectedFlaw?.id}
          />
        </section>
      )}
    </div>
  );
};
