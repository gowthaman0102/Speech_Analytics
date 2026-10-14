import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react';
import { ProcessingStepper } from '../components/ProcessingStepper';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { evaluationApi } from '../api/evaluationApi';
import type { EvaluationStatus } from '../types';

export const ProcessingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [statusData, setStatusData] = useState<EvaluationStatus | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isFailed, setIsFailed] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const pollTimeoutRef = useRef<number | null>(null);

  // Timer for elapsed duration
  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Polling logic with backoff
  useEffect(() => {
    if (!id) return;
    let isCancelled = false;

    const poll = async () => {
      try {
        const data = await evaluationApi.getEvaluationStatus(id);
        if (isCancelled) return;
        setStatusData(data);

        if (data.status === 'COMPLETED') {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => {
            navigate(`/results/${id}`, { replace: true });
          }, 600);
          return;
        }

        if (data.status === 'FAILED') {
          setIsFailed(true);
          setErrorMessage(data.error_message || 'Evaluation encountered an unexpected problem.');
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }

        const interval = elapsedSeconds > 20 ? 3000 : 1500;
        pollTimeoutRef.current = window.setTimeout(poll, interval);
      } catch (err: unknown) {
        if (isCancelled) return;
        console.error('Polling error:', err);
        const interval = elapsedSeconds > 20 ? 4000 : 2500;
        pollTimeoutRef.current = window.setTimeout(poll, interval);
      }
    };

    poll();

    return () => {
      isCancelled = true;
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [id, navigate, elapsedSeconds]);

  const progress = statusData?.progress ?? 5;

  return (
    <div className="min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <Card className="p-8 space-y-6 text-left">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-6 border-b border-border">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {!isFailed ? (
                  <Badge variant="accent" size="sm">
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    <span>In progress</span>
                  </Badge>
                ) : (
                  <Badge variant="danger" size="sm">
                    <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                    <span>Failed</span>
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-extrabold text-text tracking-tight">
                {isFailed ? 'Evaluation stopped' : 'Analyzing speech delivery'}
              </h1>
              <p className="text-sm text-text-muted mt-1 leading-relaxed">
                {isFailed
                  ? 'We were unable to complete the analysis for this recording.'
                  : 'This usually takes about twenty seconds.'}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-semibold text-text-muted tabular-nums block">
                {elapsedSeconds}s elapsed
              </span>
              <span className="text-sm font-extrabold text-accent tabular-nums block mt-0.5">
                {progress}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          {!isFailed && (
            <div className="space-y-2">
              <div
                className="w-full h-2 bg-surface-2 rounded-full overflow-hidden border border-border"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Evaluation progress"
              >
                <div
                  className="h-full bg-accent transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${Math.max(progress, 6)}%` }}
                />
              </div>
            </div>
          )}

          {/* Failure State */}
          {isFailed ? (
            <div className="space-y-4 my-4">
              <div className="p-4 rounded-xl border border-danger/30 bg-danger-soft text-danger text-sm leading-relaxed">
                <div className="font-bold mb-1">Processing note</div>
                <div className="text-xs break-words">
                  {errorMessage}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  onClick={() => navigate('/evaluate')}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try again</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/evaluations')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>View past evaluations</span>
                </Button>
              </div>
            </div>
          ) : (
            /* Stepper */
            <div className="my-4">
              <ProcessingStepper
                progress={progress}
                status={statusData?.status ?? 'PROCESSING'}
              />
            </div>
          )}

          {/* Footer note */}
          {!isFailed && (
            <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-text-muted">
              <span>Aligning words, pitch contours, and tempo</span>
              <button
                type="button"
                onClick={() => navigate('/evaluations')}
                className="text-accent font-semibold hover:underline cursor-pointer"
              >
                View history
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
