import React, { useRef, useState } from 'react';
import { UploadCloud, FileAudio, X, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export interface DropzoneProps {
  label: string;
  helperText?: string;
  accept?: string;
  maxSizeBytes?: number;
  file: File | null;
  onFileSelect: (file: File | null) => void;
  error?: string;
  className?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  label,
  helperText = 'WAV, MP3, M4A, FLAC, or OGG up to 50 MB',
  accept = '.wav,.mp3,.m4a,.flac,.ogg,audio/*',
  maxSizeBytes = 50 * 1024 * 1024,
  file,
  onFileSelect,
  error: propError,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const error = propError || internalError;

  const handleFile = (selectedFile: File) => {
    setInternalError(null);
    if (selectedFile.size > maxSizeBytes) {
      setInternalError(`File size (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB) exceeds 50 MB limit.`);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setAudioUrl(url);

    const tempAudio = new Audio();
    tempAudio.src = url;
    tempAudio.onloadedmetadata = () => {
      setDuration(tempAudio.duration);
    };

    onFileSelect(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setDuration(null);
    setInternalError(null);
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-1.5 text-left ${className}`}>
      <span className="block text-sm font-medium text-[--text]">{label}</span>

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative p-6 rounded-[8px] border-2 border-dashed transition-all cursor-pointer text-center bg-[--surface] ${
            isDragOver
              ? 'border-[--accent] bg-[--accent-soft]'
              : error
              ? 'border-[--danger] bg-[--danger-soft]'
              : 'border-[--border-strong] hover:border-[--accent] hover:bg-[--surface-2]'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-2.5 rounded-full bg-[--surface-2] text-[--text-muted]">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-[--text]">
                Drop audio file here, or <span className="text-[--accent] underline">browse</span>
              </p>
              <p className="text-xs text-[--text-muted] mt-1">{helperText}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-[8px] border border-[--border] bg-[--surface] space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded bg-[--accent-soft] text-[--accent] shrink-0">
                <FileAudio className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[--text] truncate">{file.name}</p>
                <p className="text-xs text-[--text-muted] tabular-nums mt-0.5">
                  {formatFileSize(file.size)}
                  {duration !== null && ` • ${formatDuration(duration)}`}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              onClick={handleRemove}
              aria-label="Remove audio file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {audioUrl && (
            <div className="pt-2 border-t border-[--border]">
              <audio src={audioUrl} controls className="w-full h-8" />
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1.5 text-xs text-[--danger]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
