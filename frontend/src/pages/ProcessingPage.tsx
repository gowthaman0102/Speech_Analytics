import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle, ArrowLeft, RefreshCw, Layers } from 'lucide-react';
import { ProcessingStepper } from '../components/ProcessingStepper';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
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
          // Give brief visual confirmation then redirect
          setTimeout(() => {
            navigate(`/results/${id}`, { replace: true });
          }, 600);
          return;
        }

        if (data.status === 'FAILED') {
          setIsFailed(true);
          setErrorMessage(data.error_message || 'Evaluation pipeline encountered an unexpected error.');
          if (timerRef.current) clearInterval(timerRef.current);
          return;
        }

        // Schedule next poll with backoff: 1500ms initially, 3000ms after 20s
        const interval = elapsedSeconds > 20 ? 3000 : 1500;
        pollTimeoutRef.current = window.setTimeout(poll, interval);
      } catch (err: unknown) {
        if (isCancelled) return;
        console.error('Polling error:', err);
        // Continue polling in case backend was briefly restarting or busy
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
  const currentStep = statusData?.current_step ?? 'Initializing pipeline';

  return (
    <div className="min-h-[calc(100vh-56px)] py-12 px-4 sm:px-6 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <Card className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b border-[var(--border)]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {!isFailed ? (
                  <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin" aria-hidden="true" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-[var(--error)]" aria-hidden="true" />
                )}
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted-foreground)]">
                  Evaluation #{id}
                </span>
              </div>
              <h1 className="text-xl font-semibold text-[var(--foreground)]">
                {isFailed ? 'Evaluation Failed' : 'Analyzing Speech Delivery'}
              </h1>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                {isFailed
                  ? 'An error occurred during contrastive feature extraction.'
                  : 'Comparing acoustic features against reference delivery.'}
              </p>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-mono text-[var(--muted-foreground)] block">
                Elapsed: {elapsedSeconds}s
              </span>
              <span className="text-xs font-mono font-medium text-[var(--foreground)] block mt-0.5">
                {progress}%
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          {!isFailed && (
            <div className="mb-6">
              <div
                className="w-full h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Evaluation progress"
              >
                <div
                  className="h-full bg-[var(--accent)] transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(progress, 4)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-[var(--muted-foreground)]">
                <span className="truncate max-w-[320px] font-mono">{currentStep}</span>
                <span>{progress === 100 ? 'Finalizing...' : 'Processing...'}</span>
              </div>
            </div>
          )}

          {/* Failure State */}
          {isFailed ? (
            <div className="space-y-4 my-6">
              <div className="p-4 rounded-md border border-red-200 bg-red-50 text-red-900 text-sm">
                <div className="font-medium mb-1">Processing Error</div>
                <div className="text-xs text-red-800 font-mono break-words">
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
                  Start New Evaluation
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/evaluations')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  View History
                </Button>
              </div>
            </div>
          ) : (
            /* Stepper */
            <div className="my-6">
              <ProcessingStepper
                progress={progress}
                currentStep={currentStep}
                status={statusData?.status ?? 'PROCESSING'}
              />
            </div>
          )}

          {/* Footer note */}
          {!isFailed && (
            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted-foreground)]">
              <span>This usually takes 10 to 30 seconds.</span>
              <Link
                to="/evaluations"
                className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline"
              >
                <Layers className="w-3.5 h-3.5" />
                Run in background
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
