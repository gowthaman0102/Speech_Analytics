import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Sparkles, ChevronDown, ChevronUp, Mic, Video, ArrowRight } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Dropzone } from '../components/ui/Dropzone';
import { Button } from '../components/ui/Button';
import { Banner } from '../components/ui/Banner';
import { evaluationApi, getErrorMessage } from '../api/evaluationApi';

const SPEECH_CATEGORIES = [
  'Auto Detect',
  'Persuasive Oratory',
  'Debate & Policy Argument',
  'Motivational Keynote',
  'Interpretive Reading / Dramatic',
  'Extemporaneous Speaking',
  'Declamation',
];

export const NewEvaluationPage: React.FC = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState<string>('');
  const [speechType, setSpeechType] = useState<string>('Auto Detect');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [showTranscriptOption, setShowTranscriptOption] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
    setSpeechType('Auto Detect');
    setMediaFile(null);
    setTranscript('');
    setShowTranscriptOption(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaFile) {
      document.getElementById('media-dropzone-input')?.click();
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('title', title.trim() || mediaFile.name.replace(/\.[^/.]+$/, ''));
      formData.append('speech_type', speechType);
      formData.append('media_file', mediaFile);
      if (transcript.trim()) {
        formData.append('transcript', transcript.trim());
      }

      const res = await evaluationApi.createEvaluation(formData);
      navigate(`/processing/${res.evaluationId}`);
    } catch (err) {
      setError(getErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[720px] mx-auto px-6 py-10 md:py-14 space-y-8 text-left">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
          New speech evaluation
        </h1>
        <p className="text-sm text-text-muted leading-relaxed">
          Upload a recording of the speaker's delivery. SpeechScope automatically transcribes the words, measures vocal melody and cadence, and flags moments that need attention.
        </p>
      </div>

      {error && (
        <Banner variant="danger" title="Could not start evaluation">
          {error}
        </Banner>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 divide-y divide-border">
        {/* Section 1: Details & Category */}
        <div className="space-y-4 pt-1 first:pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Speech title"
              placeholder="e.g. Environmental Leadership Oratory"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              helperText="Optional descriptive title."
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-sm font-semibold text-text">
                Speaking category
              </label>
              <select
                value={speechType}
                onChange={(e) => setSpeechType(e.target.value)}
                className="w-full h-10 px-3.5 text-sm bg-surface border border-border rounded-xl text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all cursor-pointer"
              >
                {SPEECH_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted">
                Calibrates delivery expectations for this style.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Media Upload */}
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-bold text-text flex items-center gap-1.5">
                <Mic className="h-4 w-4 text-accent" />
                <span>Speech recording</span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Upload participant audio or video. Audio track is extracted automatically.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted font-medium">
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-2 border border-border">
                <Mic className="h-3 w-3 text-accent" /> Audio
              </span>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-2 border border-border">
                <Video className="h-3 w-3 text-teal" /> Video
              </span>
            </div>
          </div>

          <Dropzone
            label=""
            helperText="Audio (.wav, .mp3, .m4a, .flac) or Video (.mp4, .mov, .webm) up to 100 MB"
            accept=".wav,.mp3,.m4a,.flac,.ogg,.aac,.mp4,.mov,.mkv,.webm,audio/*,video/*"
            maxSizeBytes={100 * 1024 * 1024}
            file={mediaFile}
            onFileSelect={setMediaFile}
          />
        </div>

        {/* Section 3: Optional Transcript */}
        <div className="pt-6 space-y-3">
          <button
            type="button"
            onClick={() => setShowTranscriptOption(!showTranscriptOption)}
            className="flex items-center justify-between w-full text-left py-1 text-sm font-semibold text-text hover:text-accent transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-text-muted" />
              <span>Have a prepared reference transcript? (Optional)</span>
            </span>
            {showTranscriptOption ? (
              <ChevronUp className="h-4 w-4 text-text-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-text-muted" />
            )}
          </button>

          {showTranscriptOption && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-muted">
                  Leave blank to generate transcription automatically, or paste the intended text.
                </p>
                <label className="text-xs text-accent hover:text-accent-hover font-semibold cursor-pointer inline-flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Import .txt</span>
                  <input type="file" accept=".txt" className="hidden" onChange={handleImportTxt} />
                </label>
              </div>

              <Textarea
                rows={5}
                placeholder="Paste the prepared speech text here…"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                showWordCount={true}
              />
            </div>
          )}
        </div>

        {/* Section 4: Action Bar */}
        <div className="pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              {mediaFile ? (
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="gap-2 px-6 shadow-sm w-full sm:w-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Run evaluation</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={() => document.getElementById('media-dropzone-input')?.click()}
                  className="gap-2 px-6 shadow-sm w-full sm:w-auto"
                >
                  <span>Choose speech file</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Button
              type="button"
              variant="tertiary"
              size="sm"
              disabled={loading}
              onClick={handleReset}
            >
              Reset
            </Button>
          </div>

          {/* Single clean sample recordings entry point below form */}
          <div className="pt-4 border-t border-border flex items-center justify-between flex-wrap gap-2 text-xs text-text-muted">
            <span>Don't have your own audio ready?</span>
            <button
              type="button"
              onClick={handleUseSampleData}
              disabled={loading}
              className="text-accent hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>Use sample recordings</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
