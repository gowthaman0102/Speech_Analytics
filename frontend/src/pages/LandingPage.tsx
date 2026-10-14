import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { evaluationApi } from '../api/evaluationApi';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [openingSample, setOpeningSample] = useState<boolean>(false);

  const handleOpenSample = async () => {
    try {
      setOpeningSample(true);
      const res = await evaluationApi.startDemoEvaluation();
      navigate(`/processing/${res.evaluationId}`);
    } catch {
      navigate('/evaluate');
    } finally {
      setOpeningSample(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 md:py-14 space-y-16">
      {/* Hero Section Container (rounded-[22px] surface-2 block) */}
      <section className="bg-surface-2 border border-border-strong rounded-[22px] p-8 md:p-12 shadow-[0_1px_0_rgba(120,80,40,0.08)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface text-accent text-xs font-bold border border-border shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Coaching & Speech Delivery Analytics</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-text tracking-tight leading-[1.15]">
              Hear the difference in every delivery.
            </h1>

            <p className="text-base sm:text-lg text-text-muted leading-relaxed max-w-[52ch]">
              Upload a reference reading and a speaker's take. SpeechScope aligns every syllable, scores delivery across pitch, energy and rhythm, and flags the exact moments that need attention.
            </p>

            <div className="pt-2 flex items-center gap-3.5 flex-wrap">
              <Link to="/evaluate">
                <Button variant="primary" size="lg" className="gap-2">
                  <span>Start an evaluation</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="lg"
                loading={openingSample}
                onClick={handleOpenSample}
                className="gap-2"
              >
                <span>View sample</span>
              </Button>
            </div>
          </div>

          {/* Right Column: Clean Waveform Preview */}
          <div className="lg:col-span-5">
            <div className="p-5 rounded-2xl bg-surface border border-border space-y-4 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-text-muted border-b border-border pb-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal" />
                  Synchronized comparison
                </span>
                <span className="tabular-nums">00:00 — 00:30.9</span>
              </div>

              {/* Reference track */}
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-teal">Reference delivery</span>
                  <span className="text-text-muted">135 WPM • Balanced</span>
                </div>
                <div className="h-14 bg-surface-2 rounded-xl p-2.5 flex items-center border border-border">
                  <svg viewBox="0 0 300 40" className="w-full h-full text-teal" fill="none" preserveAspectRatio="none">
                    <path
                      d="M0,20 Q15,6 30,20 T60,20 T90,9 T120,20 T150,20 T180,8 T210,20 T240,20 T270,12 T300,20"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M0,20 Q15,34 30,20 T60,20 T90,31 T120,20 T150,20 T180,32 T210,20 T240,20 T270,28 T300,20"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              {/* Participant track with flagged region */}
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-accent">Participant attempt</span>
                  <span className="text-flaw-medium font-bold">182 WPM • Accelerated</span>
                </div>
                <div className="h-14 bg-surface-2 rounded-xl p-2.5 relative overflow-hidden flex items-center border border-border">
                  {/* Flagged moment */}
                  <div
                    className="absolute top-0 bottom-0 left-[28%] w-[26%] bg-flaw-medium/20 border-t-2 border-b-2 border-flaw-medium"
                    title="Flagged: Rushed Delivery (+40% WPM)"
                  />
                  <svg viewBox="0 0 300 40" className="w-full h-full text-accent" fill="none" preserveAspectRatio="none">
                    <path
                      d="M0,20 Q10,3 20,20 T40,20 T60,3 T80,20 T100,3 T120,20 T150,20 T180,3 T210,20 T240,20 T270,3 T300,20"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M0,20 Q10,37 20,20 T40,20 T60,37 T80,20 T100,37 T120,20 T150,20 T180,37 T210,20 T240,20 T270,37 T300,20"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-text-muted">
                <span className="inline-flex items-center gap-1.5 font-bold text-flaw-medium">
                  <span className="w-2 h-2 rounded-full bg-flaw-medium" />
                  04.6s — 08.0s Rushed phrase
                </span>
                <span className="font-semibold text-text-subtle">+40% pace delta</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Section: How it works */}
      <section className="text-left space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight">
            How it works
          </h2>
          <p className="text-sm text-text-muted mt-1 leading-relaxed">
            Three straightforward steps from audio recordings to clear, actionable coaching notes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-surface-2 border border-border space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-accent text-white font-extrabold text-sm flex items-center justify-center">
              1
            </div>
            <h3 className="text-base font-bold text-text">
              Upload two recordings
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              A reference reading you trust, and the speaker's attempt. SpeechScope transcribes and aligns both automatically.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-surface-2 border border-border space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-accent text-white font-extrabold text-sm flex items-center justify-center">
              2
            </div>
            <h3 className="text-base font-bold text-text">
              See the delivery side by side
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              Pitch contours, energy curves, and waveforms line up word by word so you can see where delivery drifted.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-surface-2 border border-border space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-accent text-white font-extrabold text-sm flex items-center justify-center">
              3
            </div>
            <h3 className="text-base font-bold text-text">
              Get clear coaching notes
            </h3>
            <p className="text-sm text-text-muted leading-relaxed">
              A reproducible score out of 100 with flagged moments, timestamps, and concrete suggestions for the next take.
            </p>
          </div>
        </div>
      </section>

      {/* 2x2 Grid: What you get */}
      <section className="text-left space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-text tracking-tight">
            What you get
          </h2>
          <p className="text-sm text-text-muted mt-1 leading-relaxed">
            Objective evaluation tools built for speech coaches, debaters, and presenters.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-surface border-[1.5px] border-border space-y-2 shadow-[0_1px_0_rgba(120,80,40,0.08)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-teal shrink-0" />
              <h3 className="text-base font-bold text-text">Precise timestamps</h3>
            </div>
            <p className="text-sm text-text-muted leading-relaxed pl-7">
              Every hesitation, rushed phrase, and monotone stretch pinned to the exact second.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border-[1.5px] border-border space-y-2 shadow-[0_1px_0_rgba(120,80,40,0.08)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-teal shrink-0" />
              <h3 className="text-base font-bold text-text">Three delivery pillars</h3>
            </div>
            <p className="text-sm text-text-muted leading-relaxed pl-7">
              Separate scores for melody (pitch), dynamism (energy), and pace (rhythm).
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border-[1.5px] border-border space-y-2 shadow-[0_1px_0_rgba(120,80,40,0.08)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-teal shrink-0" />
              <h3 className="text-base font-bold text-text">Objective scoring</h3>
            </div>
            <p className="text-sm text-text-muted leading-relaxed pl-7">
              A consistent rubric so two coaches give the same speaker the same fair feedback.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-surface border-[1.5px] border-border space-y-2 shadow-[0_1px_0_rgba(120,80,40,0.08)]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-teal shrink-0" />
              <h3 className="text-base font-bold text-text">Exportable reports</h3>
            </div>
            <p className="text-sm text-text-muted leading-relaxed pl-7">
              Printable summaries ready to hand to speakers or debaters after their session.
            </p>
          </div>
        </div>
      </section>

      {/* Coach's notebook banner */}
      <section className="p-6 rounded-2xl bg-surface-2 border border-border text-sm text-text-muted text-left leading-relaxed">
        <strong className="text-text font-bold">Coaching tip: </strong>
        Scores and flagged differences reflect contrast against the chosen reference reading, not a rigid or universal standard. Choosing an appropriate reference ensures evaluation matches your event's goals.
      </section>
    </div>
  );
};
