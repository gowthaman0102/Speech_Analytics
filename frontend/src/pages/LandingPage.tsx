import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UploadCloud } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-16 space-y-16">
      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Editorial Value Proposition */}
        <div className="lg:col-span-7 space-y-5 text-left">
          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-semibold text-[--text] tracking-tight leading-[1.15]">
            See exactly where a speech goes off course.
          </h1>

          <p className="text-lg text-[--text-muted] leading-relaxed max-w-[54ch]">
            SpeechScope aligns a speaker’s delivery against an ideal reference reading of the same transcript,
            grounding pace, volume, pitch, and pause differences with sub-second timestamps and measurable evidence.
          </p>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            <Link to="/evaluate">
              <Button variant="primary" size="lg" className="gap-2">
                <UploadCloud className="w-4 h-4" />
                <span>Upload speech to evaluate</span>
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="lg"
              loading={openingSample}
              onClick={handleOpenSample}
            >
              Open sample demo
            </Button>
          </div>
        </div>

        {/* Right Column: Static, Real-Looking Waveform Preview */}
        <div className="lg:col-span-5">
          <div className="p-4 rounded-[8px] bg-[--surface] border border-[--border] space-y-3">
            <div className="flex items-center justify-between text-xs text-[--text-muted] border-b border-[--border] pb-2 font-mono">
              <span>Synchronized analysis</span>
              <span>00:00 — 00:30.9</span>
            </div>

            {/* Reference track */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-[--text-muted]">
                <span className="font-medium text-[--series-ref]">Reference</span>
                <span>135 WPM • Standard</span>
              </div>
              <div className="h-14 bg-[--surface-2] rounded-[4px] p-2 flex items-center justify-between">
                <svg viewBox="0 0 300 40" className="w-full h-full text-[--series-ref]" fill="none" preserveAspectRatio="none">
                  <path
                    d="M0,20 Q15,5 30,20 T60,20 T90,8 T120,20 T150,20 T180,6 T210,20 T240,20 T270,12 T300,20"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                  <path
                    d="M0,20 Q15,35 30,20 T60,20 T90,32 T120,20 T150,20 T180,34 T210,20 T240,20 T270,28 T300,20"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                </svg>
              </div>
            </div>

            {/* Participant track with highlighted moment */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-[--text-muted]">
                <span className="font-medium text-[--series-participant]">Participant</span>
                <span>182 WPM • Accelerated</span>
              </div>
              <div className="h-14 bg-[--surface-2] rounded-[4px] p-2 relative overflow-hidden flex items-center justify-between">
                {/* Highlighted flaw region */}
                <div
                  className="absolute top-0 bottom-0 left-[28%] w-[26%] bg-[#D9822B]/15 border-t-2 border-[#D9822B]"
                  title="Flagged: Rushed Delivery (+40% WPM)"
                />
                <svg viewBox="0 0 300 40" className="w-full h-full text-[--series-participant]" fill="none" preserveAspectRatio="none">
                  <path
                    d="M0,20 Q10,2 20,20 T40,20 T60,2 T80,20 T100,2 T120,20 T150,20 T180,2 T210,20 T240,20 T270,2 T300,20"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                  <path
                    d="M0,20 Q10,38 20,20 T40,20 T60,38 T80,20 T100,38 T120,20 T150,20 T180,38 T210,20 T240,20 T270,38 T300,20"
                    stroke="currentColor"
                    strokeWidth="1.75"
                  />
                </svg>
              </div>
            </div>

            <div className="pt-2 border-t border-[--border] flex items-center justify-between text-[11px] text-[--text-muted]">
              <span className="inline-flex items-center gap-1.5 font-medium text-[#D9822B]">
                <span className="w-2 h-2 rounded-full bg-[#D9822B]" />
                04.6s — 08.0s Rushed delivery
              </span>
              <span className="font-mono text-[--text-subtle]">+40% pace delta</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works (Vertical 3-step list with hairline dividers) */}
      <section className="border-t border-[--border] pt-12 text-left space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[--text] tracking-tight">
            How evaluation works
          </h2>
          <p className="text-sm text-[--text-muted] mt-1">
            Three straightforward stages from raw audio to sub-second acoustic diagnosis.
          </p>
        </div>

        <div className="divide-y divide-[--border] border border-[--border] rounded-[8px] bg-[--surface]">
          <div className="p-5 flex items-start gap-4">
            <span className="text-sm font-semibold font-mono text-[--accent] shrink-0 w-6 pt-0.5">
              1
            </span>
            <div>
              <h3 className="text-sm font-semibold text-[--text]">Upload speech and reference</h3>
              <p className="text-xs text-[--text-muted] mt-1 leading-relaxed">
                Provide the canonical transcript alongside a high-quality reference recording and the participant’s recording.
              </p>
            </div>
          </div>

          <div className="p-5 flex items-start gap-4">
            <span className="text-sm font-semibold font-mono text-[--accent] shrink-0 w-6 pt-0.5">
              2
            </span>
            <div>
              <h3 className="text-sm font-semibold text-[--text]">Align timelines and extract signals</h3>
              <p className="text-xs text-[--text-muted] mt-1 leading-relaxed">
                Sub-second lexical alignment maps matching words. Dynamic Time Warping aligns pitch contours, volume dynamics, and speaking cadence.
              </p>
            </div>
          </div>

          <div className="p-5 flex items-start gap-4">
            <span className="text-sm font-semibold font-mono text-[--accent] shrink-0 w-6 pt-0.5">
              3
            </span>
            <div>
              <h3 className="text-sm font-semibold text-[--text]">Review timestamped feedback and scores</h3>
              <p className="text-xs text-[--text-muted] mt-1 leading-relaxed">
                Explore flagged delivery moments with side-by-side waveforms, measurable acoustic deltas, reproducible rubric scores, and clear advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What you get (Two-column definition list) */}
      <section className="border-t border-[--border] pt-12 text-left space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[--text] tracking-tight">
            What you get
          </h2>
          <p className="text-sm text-[--text-muted] mt-1">
            Deterministic evaluation reports designed for speakers, coaches, and competition judges.
          </p>
        </div>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
          <div className="space-y-1">
            <dt className="font-semibold text-[--text]">Scores by category</dt>
            <dd className="text-xs text-[--text-muted] leading-relaxed">
              Standard 0–100 rubric scores across Pace & Fluency, Pitch Modulation, Pause Dynamics, Vocal Energy, Clarity, and Overall Delivery.
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="font-semibold text-[--text]">Timestamped flags</dt>
            <dd className="text-xs text-[--text-muted] leading-relaxed">
              Sub-second temporal intervals highlighting exactly where delivery rushed, slowed down, paused awkwardly, or dropped projection.
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="font-semibold text-[--text]">Plain-language explanations</dt>
            <dd className="text-xs text-[--text-muted] leading-relaxed">
              Every flagged moment includes what happened, the perceptual impact on listeners, and practical coaching suggestions.
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="font-semibold text-[--text]">Side-by-side waveforms</dt>
            <dd className="text-xs text-[--text-muted] leading-relaxed">
              Synchronized audio inspection with synchronized seeking, metric overlays, and interactive transcript scrubbing.
            </dd>
          </div>
        </dl>
      </section>

      {/* Calm note explaining reference-relative scoring */}
      <section className="p-4 rounded-[8px] bg-[--surface-2] border border-[--border] text-xs text-[--text-muted] text-left leading-relaxed">
        <strong className="text-[--text] font-semibold">Note on reference-relative evaluation: </strong>
        Scores and flagged differences reflect contrast against the chosen reference reading, not an absolute or universal judgment of rhetorical style. Choosing an appropriate reference ensures evaluation aligns with your competition’s conventions.
      </section>
    </div>
  );
};
