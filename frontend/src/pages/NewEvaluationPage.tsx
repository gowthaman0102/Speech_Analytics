import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, Music, FileText, Sparkles, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { evaluationApi } from '../api/evaluationApi';

export const NewEvaluationPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [title, setTitle] = useState<string>('Competitive Oratory Evaluation');
  const [transcript, setTranscript] = useState<string>('');
  const [refFile, setRefFile] = useState<File | null>(null);
  const [partFile, setPartFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If query param demo=true is present, load demo
  useEffect(() => {
    if (searchParams.get('demo') === 'true') {
      loadDemoData();
    }
  }, [searchParams]);

  const loadDemoData = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await evaluationApi.startDemoEvaluation();
      navigate(`/results/${res.evaluationId}`);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Failed to start demo evaluation.');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) {
      setErrorMessage('Please provide the transcript text.');
      return;
    }
    if (!refFile || !partFile) {
      setErrorMessage('Please upload both the reference and participant audio recordings.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('transcript', transcript.trim());
    formData.append('reference_audio', refFile);
    formData.append('participant_audio', partFile);

    try {
      const res = await evaluationApi.createEvaluation(formData);
      navigate(`/results/${res.evaluationId}`);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Evaluation failed. Please verify your audio files.');
      setIsSubmitting(false);
    }
  };

  const handleTxtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTranscript(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">New Speech Evaluation</h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload the speech transcript, reference audio baseline, and participant recording
          </p>
        </div>

        <button
          type="button"
          onClick={loadDemoData}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all self-start"
        >
          <Sparkles className="h-4 w-4" />
          <span>Load Prebuilt Demo</span>
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-300 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Speech Title or Event Name
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="e.g. Persuasive Oratory Finals"
            required
          />
        </div>

        {/* Transcript Input */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Exact Speech Transcript
            </label>
            <label className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 cursor-pointer flex items-center gap-1">
              <Upload className="h-3.5 w-3.5" />
              <span>Import .txt File</span>
              <input type="file" accept=".txt" onChange={handleTxtUpload} className="hidden" />
            </label>
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors font-serif leading-relaxed"
            placeholder="Paste the official speech transcript here..."
            required
          />
          <p className="text-[11px] text-slate-500 mt-2">
            The transcript serves as the authoritative lexical anchor for sub-second word alignment.
          </p>
        </div>

        {/* Audio Upload Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reference Audio */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-cyan-400">
                <Music className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Reference / Ideal Audio</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                High-quality baseline recording (.wav, .mp3, .m4a, .flac)
              </p>

              <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/50">
                <Upload className="h-8 w-8 text-slate-500 mb-2" />
                <span className="text-xs font-semibold text-slate-300">
                  {refFile ? refFile.name : 'Choose Reference Audio'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1">Up to 10 minutes</span>
                <input
                  type="file"
                  accept="audio/*,.wav,.mp3,.m4a,.flac"
                  onChange={(e) => e.target.files?.[0] && setRefFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

            {refFile && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="truncate max-w-[200px]">{refFile.name}</span>
                <span className="text-emerald-400 font-semibold">{(refFile.size / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
            )}
          </div>

          {/* Participant Audio */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-rose-400">
                <Music className="h-4 w-4" />
                <h3 className="text-xs font-bold uppercase tracking-wider">Participant Audio</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Participant speech delivery to be evaluated and scored
              </p>

              <label className="border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/50">
                <Upload className="h-8 w-8 text-slate-500 mb-2" />
                <span className="text-xs font-semibold text-slate-300">
                  {partFile ? partFile.name : 'Choose Participant Audio'}
                </span>
                <span className="text-[10px] text-slate-500 mt-1">Up to 10 minutes</span>
                <input
                  type="file"
                  accept="audio/*,.wav,.mp3,.m4a,.flac"
                  onChange={(e) => e.target.files?.[0] && setPartFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>

            {partFile && (
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="truncate max-w-[200px]">{partFile.name}</span>
                <span className="text-emerald-400 font-semibold">{(partFile.size / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-xl shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Evaluating Performance...' : 'Start Contrastive Analysis'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
