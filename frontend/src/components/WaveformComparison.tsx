import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Lock, Unlock } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import type { FlawSegment, PlaybackRequest } from '../types';

interface WaveformComparisonProps {
  referenceAudioUrl?: string | null;
  participantAudioUrl: string;
  flaws: FlawSegment[];
  selectedFlawId?: string;
  onSelectFlaw?: (flawId: string) => void;
  seekTime?: number | null;
  playbackRequest?: PlaybackRequest | null;
  onTimeUpdate?: (currentTime: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export const WaveformComparison: React.FC<WaveformComparisonProps> = ({
  referenceAudioUrl,
  participantAudioUrl,
  flaws,
  selectedFlawId,
  onSelectFlaw,
  seekTime,
  playbackRequest,
  onTimeUpdate,
  onPlayStateChange,
}) => {
  const refContainerRef = useRef<HTMLDivElement>(null);
  const partContainerRef = useRef<HTMLDivElement>(null);

  const refWaveSurfer = useRef<WaveSurfer | null>(null);
  const partWaveSurfer = useRef<WaveSurfer | null>(null);
  const pendingRequestRef = useRef<PlaybackRequest | null>(null);
  const snippetEndRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTrack, setActiveTrack] = useState<'participant' | 'reference' | 'both'>('participant');
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Initialize Reference WaveSurfer
  useEffect(() => {
    if (!refContainerRef.current || !referenceAudioUrl) return;

    const wsRef = WaveSurfer.create({
      container: refContainerRef.current,
      waveColor: '#8FBDBD',
      progressColor: '#2F6F73',
      cursorColor: '#2F6F73',
      cursorWidth: 2,
      height: 64,
      barWidth: 3,
      barGap: 3,
      barRadius: 3,
      normalize: true,
      url: referenceAudioUrl,
    });

    refWaveSurfer.current = wsRef;

    return () => {
      wsRef.destroy();
    };
  }, [referenceAudioUrl]);

  // Initialize Participant WaveSurfer
  useEffect(() => {
    if (!partContainerRef.current) return;

    const wsPart = WaveSurfer.create({
      container: partContainerRef.current,
      waveColor: '#E8A98F',
      progressColor: '#C2562D',
      cursorColor: '#C2562D',
      cursorWidth: 2,
      height: 64,
      barWidth: 3,
      barGap: 3,
      barRadius: 3,
      normalize: true,
      url: participantAudioUrl,
    });

    partWaveSurfer.current = wsPart;

    wsPart.on('ready', () => {
      const dur = wsPart.getDuration();
      setDuration(dur);

      if (pendingRequestRef.current) {
        const req = pendingRequestRef.current;
        pendingRequestRef.current = null;
        try {
          snippetEndRef.current = req.end !== undefined && req.end > req.start ? req.end : null;
          wsPart.setTime(req.start);
          if (req.playImmediately) {
            wsPart.play().catch(() => {});
          }
        } catch (e) {
          console.warn('Pending seek error:', e);
        }
      }
    });

    wsPart.on('timeupdate', (t) => {
      setCurrentTime(t);
      onTimeUpdate?.(t);

      // Check if snippet boundary reached
      if (snippetEndRef.current !== null && t >= snippetEndRef.current) {
        snippetEndRef.current = null;
        wsPart.pause();
      }
    });

    wsPart.on('play', () => {
      setIsPlaying(true);
      onPlayStateChange?.(true);
    });

    wsPart.on('pause', () => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
    });

    wsPart.on('finish', () => {
      setIsPlaying(false);
      onPlayStateChange?.(false);
      snippetEndRef.current = null;
    });

    return () => {
      wsPart.destroy();
    };
  }, [participantAudioUrl]);

  // Handle PlaybackRequest from parent (e.g. sentence play button or timeline seek)
  useEffect(() => {
    if (!playbackRequest) return;
    const { start, end, playImmediately } = playbackRequest;

    const wsPart = partWaveSurfer.current;
    if (!wsPart) {
      pendingRequestRef.current = playbackRequest;
      return;
    }

    if (!playImmediately) {
      snippetEndRef.current = null;
      wsPart.pause();
      if (refWaveSurfer.current) refWaveSurfer.current.pause();
      return;
    }

    snippetEndRef.current = end !== undefined && end > start ? end : null;

    try {
      wsPart.setTime(start);
      if (refWaveSurfer.current) {
        refWaveSurfer.current.setTime(start);
      }
      wsPart.play().catch((err) => console.warn('Playback error:', err));
      if (activeTrack === 'both' && refWaveSurfer.current) {
        refWaveSurfer.current.play().catch(() => {});
      }
    } catch (e) {
      console.warn('Seek error:', e);
    }
  }, [playbackRequest, activeTrack]);

  // Legacy fallback seek handling if seekTime passed directly
  useEffect(() => {
    if (seekTime !== null && seekTime !== undefined && !playbackRequest) {
      snippetEndRef.current = null;
      const wsPart = partWaveSurfer.current;
      if (wsPart) {
        try {
          wsPart.setTime(seekTime);
          wsPart.play().catch(() => {});
        } catch (e) {}
      }
      if (refWaveSurfer.current) {
        try {
          refWaveSurfer.current.setTime(seekTime);
        } catch (e) {}
      }
    }
  }, [seekTime]);

  // Spacebar shortcut for Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const togglePlay = () => {
    snippetEndRef.current = null; // Clear snippet bounds when user presses main play/pause
    const partWs = partWaveSurfer.current;
    const refWs = refWaveSurfer.current;

    if (!partWs) return;

    if (isPlaying) {
      partWs.pause();
      if (refWs) refWs.pause();
    } else {
      if (activeTrack === 'participant' || !refWs) {
        if (refWs) refWs.pause();
        partWs.play().catch(() => {});
      } else if (activeTrack === 'reference') {
        partWs.pause();
        refWs.play().catch(() => {});
      } else {
        const time = partWs.getCurrentTime();
        refWs.setTime(time);
        refWs.play().catch(() => {});
        partWs.play().catch(() => {});
      }
    }
  };

  const handleRestart = () => {
    snippetEndRef.current = null;
    if (partWaveSurfer.current) {
      partWaveSurfer.current.setTime(0);
      partWaveSurfer.current.play().catch(() => {});
    }
    if (refWaveSurfer.current) {
      refWaveSurfer.current.setTime(0);
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (partWaveSurfer.current) partWaveSurfer.current.setMuted(nextMute);
    if (refWaveSurfer.current) refWaveSurfer.current.setMuted(nextMute);
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (partWaveSurfer.current) partWaveSurfer.current.setPlaybackRate(rate);
    if (refWaveSurfer.current) refWaveSurfer.current.setPlaybackRate(rate);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-text tracking-tight">
              Waveform alignment & flagged moments
            </h3>
            <Badge variant="teal" size="sm">
              Interactive
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Click any flagged region or waveform position to listen. Press Space to toggle playback.
          </p>
        </div>

        {/* Track selector (when reference audio exists) */}
        {referenceAudioUrl && (
          <div className="flex items-center rounded-xl border border-border bg-surface-2 p-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveTrack('participant');
                if (refWaveSurfer.current) refWaveSurfer.current.pause();
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTrack === 'participant'
                  ? 'bg-surface text-accent font-bold shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Participant
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTrack('reference');
                if (partWaveSurfer.current) partWaveSurfer.current.pause();
              }}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                activeTrack === 'reference'
                  ? 'bg-surface text-teal font-bold shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              Reference
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTrack('both');
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${
                activeTrack === 'both'
                  ? 'bg-surface text-text font-bold shadow-xs'
                  : 'text-text-muted hover:text-text'
              }`}
              title="Lock playheads: Play both tracks simultaneously"
            >
              {activeTrack === 'both' ? <Lock className="w-3.5 h-3.5 text-accent" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>Lock</span>
            </button>
          </div>
        )}
      </div>

      {/* Waveform Displays */}
      <div className="space-y-4">
        {/* Reference Waveform */}
        {referenceAudioUrl && (
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal" />
                <span className="text-xs font-bold text-teal">
                  Reference reading
                </span>
              </div>
              <span className="text-xs text-text-muted">Target model</span>
            </div>
            <div className="rounded-xl bg-surface-2 p-2.5 border border-border">
              <div ref={refContainerRef} className="cursor-pointer" />
            </div>
          </div>
        )}

        {/* Participant Waveform with Flaws Overlay */}
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              <span className="text-xs font-bold text-accent">
                Participant delivery
              </span>
            </div>
            <span className="text-xs text-text-muted">
              {flaws.length} flagged moment{flaws.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="relative rounded-xl bg-surface-2 p-2.5 border border-border">
            <div ref={partContainerRef} className="cursor-pointer" />

            {/* Visual Flaw Overlay Bands */}
            {duration > 0 && (
              <div className="absolute inset-y-2.5 inset-x-2.5 pointer-events-none">
                {flaws.map((flaw) => {
                  const left = (flaw.start / duration) * 100;
                  const width = ((flaw.end - flaw.start) / duration) * 100;
                  const isSelected = selectedFlawId === flaw.id;

                  const colorClass =
                    flaw.severity === 'HIGH'
                      ? 'bg-danger/20 border-danger text-danger'
                      : flaw.severity === 'MEDIUM'
                      ? 'bg-flaw-medium/20 border-flaw-medium text-flaw-medium'
                      : 'bg-flaw-low/20 border-flaw-low text-text';

                  return (
                    <div
                      key={flaw.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFlaw?.(flaw.id);
                      }}
                      style={{ left: `${left}%`, width: `${Math.max(2, width)}%` }}
                      className={`absolute top-0 bottom-0 pointer-events-auto cursor-pointer border-x transition-all group ${colorClass} ${
                        isSelected
                          ? 'ring-2 ring-accent ring-offset-1 bg-accent/30 z-10'
                          : 'hover:brightness-95'
                      }`}
                      title={`${flaw.type} (${formatTime(flaw.start)} – ${formatTime(flaw.end)})`}
                    >
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 bg-surface border border-border text-text text-xs font-bold px-2 py-0.5 rounded-md shadow-xs whitespace-nowrap z-20 transition-opacity">
                        {flaw.type.replace(/_/g, ' ')} ({(flaw.duration ?? (flaw.end - flaw.start)).toFixed(1)}s)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transport Controls Bar */}
      <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-4 text-xs"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 ml-0.5" />
                <span>Play</span>
              </>
            )}
          </Button>

          <Button
            variant="secondary"
            onClick={handleRestart}
            className="p-2.5 text-xs"
            title="Restart from beginning"
            aria-label="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="secondary"
            onClick={toggleMute}
            className="p-2.5 text-xs"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-danger" /> : <Volume2 className="w-3.5 h-3.5" />}
          </Button>

          {/* Time Readout */}
          <div className="tabular-nums text-xs px-3 py-1.5 rounded-xl bg-surface-2 border border-border text-text ml-2">
            <span className="font-bold">{formatTime(currentTime)}</span>
            <span className="text-text-muted"> / {formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback speed selector & legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-text-muted mr-1">Speed:</span>
            {[0.75, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => handleRateChange(rate)}
                className={`px-2 py-0.5 rounded-lg text-xs tabular-nums font-bold transition-colors cursor-pointer ${
                  playbackRate === rate
                    ? 'bg-accent text-white'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-text-muted border-l border-border pl-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-danger/40 border border-danger" />
              <span>High flag</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-flaw-medium/40 border border-flaw-medium" />
              <span>Medium</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
