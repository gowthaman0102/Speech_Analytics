import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Target,
  BarChart3,
  Clock,
  Layers,
  CheckCircle2,
  Cpu,
  Radio,
  FileCheck2,
} from 'lucide-react';
import { evaluationApi } from '../api/evaluationApi';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRunDemo = async () => {
    try {
      const res = await evaluationApi.startDemoEvaluation();
      navigate(`/results/${res.evaluationId}`);
    } catch (e) {
      navigate('/evaluate?demo=true');
    }
  };

  const featurePillars = [
    {
      icon: Clock,
      title: 'Temporal Flaw Detection',
      desc: 'Grounds delivery issues to exact sub-second timestamps, highlighting exactly where speech rushed, faded, or stalled.',
      color: 'from-rose-500/20 to-orange-500/20 text-rose-400 border-rose-500/30',
    },
    {
      icon: Layers,
      title: 'Contrastive Speech Analysis',
      desc: 'Normalizes and compares the speaker against an ideal delivery of the exact same transcript via Dynamic Time Warping (DTW).',
      color: 'from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/30',
    },
    {
      icon: BarChart3,
      title: 'Deterministic Rubric Scoring',
      desc: 'Generates reproducible 0–100 scores across Pace & Fluency, Pitch Modulation, Pause & Rhythm, and Vocal Energy.',
      color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      icon: Cpu,
      title: 'Causal & Measurable Feedback',
      desc: 'No vague remarks. Supplies acoustic evidence (WPM, dB, Hz delta) and actionable recommendations for every flaw.',
      color: 'from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/30',
    },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-600/20 via-cyan-500/20 to-emerald-400/10 blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-300 mb-6 shadow-sm">
            <Radio className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>Competitive Speech Evaluation Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            SpeechScope{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              AI
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            Turn subjective speech judging into <strong className="text-white font-semibold">measurable</strong>,{' '}
            <strong className="text-white font-semibold">timestamped</strong>, and{' '}
            <strong className="text-white font-semibold">explainable</strong> feedback using contrastive acoustic analytics.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/evaluate"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-xl shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all"
            >
              <span>Analyze Speech</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              onClick={handleRunDemo}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-bold bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700 shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span>Try Demo Evaluation</span>
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>No Cloud API Key Needed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Deterministic Signal Math</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Sub-Second Grounding</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            How Contrastive Speech Evaluation Works
          </h2>
          <p className="text-sm text-slate-400 mt-2 max-w-2xl mx-auto">
            Instead of asking "is this speech good?", SpeechScope mathematically measures exact deviations from a high-quality delivery of the same words.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {featurePillars.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-xl backdrop-blur-sm group"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4 border`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Scientific Principle Disclaimer */}
      <section className="max-w-4xl mx-auto px-6 mt-6">
        <div className="p-6 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <Target className="h-6 w-6 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">
                Reference-Relative Delivery Analysis
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                The system measures acoustic differences relative to the selected reference performance. Scores represent similarity to the configured evaluation rubric and baseline rather than an absolute universal measure of speaking ability.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
