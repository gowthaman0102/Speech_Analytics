import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface ProcessingStepperProps {
  onComplete?: () => void;
  isBackendProcessing?: boolean;
}

export const ProcessingStepper: React.FC<ProcessingStepperProps> = ({
  onComplete,
  isBackendProcessing = true,
}) => {
  const steps = [
    { title: 'Audio upload & format validation', desc: 'Verified 16kHz mono audio streams' },
    { title: 'Audio preprocessing & peak normalization', desc: 'Scaled peak amplitude to -1 dBFS' },
    { title: 'Transcript analysis & speech-to-text', desc: 'faster-whisper token and phoneme timestamps' },
    { title: 'Temporal alignment & word anchors', desc: 'Matched reference and participant speech tokens' },
    { title: 'Acoustic feature extraction', desc: 'Pitch/F0, RMS energy, 13 MFCCs, spectral centroid' },
    { title: 'Per-speaker z-score normalization & DTW', desc: 'Dynamic Time Warping synchronized timelines' },
    { title: 'Temporal delivery flaw detection & classification', desc: 'Evaluated pacing, energy, pause, and intonation' },
    { title: 'Deterministic rubric scoring', desc: 'Computed weighted scores across 6 rubric dimensions' },
    { title: 'Causal explanation generation', desc: 'Generated measurable evidence and coaching recommendations' },
  ];

  const [currentStep, setCurrentStep] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          if (!isBackendProcessing) {
            onComplete?.();
          }
          return prev;
        }
      });
    }, 650);

    return () => clearInterval(interval);
  }, [steps.length, isBackendProcessing, onComplete]);

  // When backend finishes, advance to last step and trigger onComplete
  useEffect(() => {
    if (!isBackendProcessing && currentStep >= steps.length - 1) {
      onComplete?.();
    }
  }, [isBackendProcessing, currentStep, steps.length, onComplete]);

  return (
    <div className="max-w-2xl mx-auto bg-slate-900/90 rounded-2xl border border-slate-800 p-8 shadow-2xl backdrop-blur-md">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-3">
          <Sparkles className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">Analyzing Speech Performance</h2>
        <p className="text-sm text-slate-400 mt-1">
          Executing multi-stage contrastive acoustic evaluation against baseline
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => {
          const isDone = idx < currentStep || (!isBackendProcessing && idx <= currentStep);
          const isCurrent = idx === currentStep && isBackendProcessing;

          return (
            <div
              key={idx}
              className={`flex items-start gap-3.5 p-3 rounded-xl border transition-all ${
                isCurrent
                  ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-500/10'
                  : isDone
                  ? 'bg-slate-950/60 border-slate-800/80 text-slate-300'
                  : 'bg-slate-950/20 border-slate-900 text-slate-600'
              }`}
            >
              <div className="mt-0.5">
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] font-mono text-slate-500">
                    {idx + 1}
                  </div>
                )}
              </div>

              <div>
                <h4 className={`text-sm font-bold ${isCurrent ? 'text-white' : isDone ? 'text-slate-200' : 'text-slate-500'}`}>
                  {step.title}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
