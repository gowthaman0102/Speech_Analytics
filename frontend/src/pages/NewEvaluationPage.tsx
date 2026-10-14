import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, FileText, ArrowRight, RotateCcw } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Dropzone } from '../components/ui/Dropzone';
import { Button } from '../components/ui/Button';
import { Banner } from '../components/ui/Banner';
import { evaluationApi, getErrorMessage } from '../api/evaluationApi';

export const NewEvaluationPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState<string>('');
  const [transcript, setTranscript] = useState<string>('');
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [participantFile, setParticipantFile] = useState<File | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Client validation
  const isValid =
    transcript.trim().length > 10 &&
    referenceFile !== null &&
    participantFile !== null;

  const handleImportTxt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setTranscript(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleUseSampleData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await evaluationApi.startDemoEvaluation();
      navigate(`/processing/${res.evaluationId}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setTranscript('');
    setReferenceFile(null);
    setParticipantFile(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !referenceFile || !participantFile) {
      setError('Please provide the speech transcript, reference recording, and participant recording.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('title', title.trim() || 'Speech Evaluation');
      formData.append('transcript', transcript.trim());
      formData.append('reference_audio', referenceFile);
      formData.append('participant_audio', participantFile);

      const res = await evaluationApi.createEvaluation(formData);
      navigate(`/processing/${res.evaluationId}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[720px] mx-auto px-6 py-12 space-y-8 text-left">
      <div>
        <h1 className="text-2xl font-semibold text-[--text] tracking-tight">
          New evaluation
        </h1>
        <p className="text-sm text-[--text-muted] mt-1">
          Upload the canonical transcript and matching audio recordings to run contrastive speech analysis.
        </p>
      </div>

      {error && (
        <Banner variant="danger" title="Could not start evaluation">
          {error}
        </Banner>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-[--border]">
        {/* Section 1: Details */}
        <div className="space-y-4 pt-1 first:pt-0">
          <Input
            label="Evaluation title"
            placeholder="e.g. Persuasive Oratory Preliminary Round"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            helperText="An optional descriptive label for this evaluation run."
          />
        </div>

        {/* Section 2: Transcript */}
        <div className="space-y-3 pt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[--text]">Canonical transcript</span>
            <label className="text-xs text-[--accent] hover:text-[--accent-hover] font-medium cursor-pointer inline-flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              <span>Import .txt</span>
              <input type="file" accept=".txt" className="hidden" onChange={handleImportTxt} />
            </label>
          </div>

          <Textarea
            rows={8}
            placeholder="Paste the exact spoken words of the speech transcript here…"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            showWordCount={true}
            helperText="Paste the exact words. Timing differences between the speaker and this transcript will be evaluated."
          />
        </div>

        {/* Section 3: Audio Recordings */}
        <div className="space-y-6 pt-6">
          <div>
            <h2 className="text-sm font-semibold text-[--text]">Audio recordings</h2>
            <p className="text-xs text-[--text-muted] mt-0.5">
              Both recordings must speak the transcript above. Max file size: 50 MB each.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Dropzone
              label="1. Reference audio (Baseline standard)"
              helperText="The ideal or benchmark reading"
              file={referenceFile}
              onFileSelect={setReferenceFile}
            />

            <Dropzone
              label="2. Participant audio (Delivery to evaluate)"
              helperText="The student or speaker's recording"
              file={participantFile}
              onFileSelect={setParticipantFile}
            />
          </div>
        </div>

        {/* Section 4: Action Bar */}
        <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              disabled={!isValid}
            >
              {loading ? 'Analyzing…' : 'Run evaluation'}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={loading}
              onClick={handleUseSampleData}
            >
              Use sample data
            </Button>
          </div>

          <Button
            type="button"
            variant="tertiary"
            size="sm"
            disabled={loading}
            onClick={handleReset}
          >
            Reset form
          </Button>
        </div>
      </form>
    </div>
  );
};
