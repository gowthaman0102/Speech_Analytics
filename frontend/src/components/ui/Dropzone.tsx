import React, { useRef, useState } from 'react';
import { UploadCloud, FileAudio, FileVideo, X, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  helperText = 'Audio (WAV, MP3, M4A, FLAC) or Video (MP4, MOV, WEBM) up to 100 MB',
  accept = '.wav,.mp3,.m4a,.flac,.ogg,.aac,.mp4,.mov,.mkv,.webm,audio/*,video/*',
  maxSizeBytes = 100 * 1024 * 1024,
  file,
  onFileSelect,
  error: propError,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  const error = propError || internalError;
  const isVideo = file ? file.type.startsWith('video/') || /\.(mp4|mov|mkv|webm|avi|m4v)$/i.test(file.name) : false;

  const handleFile = (selectedFile: File) => {
    setInternalError(null);
    if (selectedFile.size > maxSizeBytes) {
      setInternalError(`File size (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB) exceeds 100 MB limit.`);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    setMediaUrl(url);

    const isVid = selectedFile.type.startsWith('video/') || /\.(mp4|mov|mkv|webm|avi|m4v)$/i.test(selectedFile.name);
    if (isVid) {
      const tempVid = document.createElement('video');
      tempVid.src = url;
      tempVid.onloadedmetadata = () => {
        setDuration(tempVid.duration);
      };
    } else {
      const tempAudio = new Audio();
      tempAudio.src = url;
      tempAudio.onloadedmetadata = () => {
        setDuration(tempAudio.duration);
      };
    }

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
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl);
    }
    setMediaUrl(null);
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
      {label && <span className="block text-sm font-medium text-[--text]">{label}</span>}

      <input
        ref={inputRef}
        id="media-dropzone-input"
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative p-8 rounded-[8px] border-2 border-dashed transition-all cursor-pointer text-center bg-[--surface] ${
            isDragOver
              ? 'border-[--accent] bg-[--accent-soft]'
              : error
              ? 'border-[--danger] bg-[--danger-soft]'
              : 'border-[--border-strong] hover:border-[--accent] hover:bg-[--surface-2]'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 rounded-full bg-[--surface-2] text-[--text-muted]">
              <UploadCloud className="h-6 w-6 text-[--accent]" />
            </div>
            <div>
              <p className="text-base font-semibold text-[--text]">
                Upload your speech audio or video
              </p>
              <p className="text-xs text-[--text-muted] mt-1">{helperText}</p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="gap-2 border-[--border-strong] hover:border-[--accent] shadow-xs"
            >
              <UploadCloud className="h-4 w-4 text-[--accent]" />
              <span>Choose Audio / Video File</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-[8px] border-2 border-emerald-500/40 bg-[--surface] space-y-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shrink-0">
                {isVideo ? <FileVideo className="h-6 w-6" /> : <FileAudio className="h-6 w-6" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[--text] truncate">{file.name}</p>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[--surface-2] text-[--text-muted] uppercase">
                    {isVideo ? 'Video' : 'Audio'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Ready to Evaluate
                  </span>
                </div>
                <p className="text-xs text-[--text-muted] tabular-nums mt-1">
                  {formatFileSize(file.size)}
                  {duration !== null && ` • Duration: ${formatDuration(duration)}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
                className="text-xs"
              >
                Change File
              </Button>
              <Button
                type="button"
                variant="tertiary"
                size="sm"
                onClick={handleRemove}
                aria-label="Remove media file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {mediaUrl && (
            <div className="pt-3 border-t border-[--border]">
              <p className="text-[11px] text-[--text-muted] font-medium mb-1.5">
                Playback preview of your uploaded file:
              </p>
              {isVideo ? (
                <video src={mediaUrl} controls className="w-full max-h-56 rounded-[6px] bg-black" />
              ) : (
                <audio src={mediaUrl} controls className="w-full h-9" />
              )}
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
