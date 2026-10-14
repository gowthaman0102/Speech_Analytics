import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Lock, Unlock } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import type { FlawSegment } from '../types';

interface WaveformComparisonProps {
  referenceAudioUrl: string;
  participantAudioUrl: string;
  flaws: FlawSegment[];
  selectedFlawId?: string;
  onSelectFlaw?: (flawId: string) => void;
  seekTime?: number | null;
}

export const WaveformComparison: React.FC<WaveformComparisonProps> = ({
  referenceAudioUrl,
  participantAudioUrl,
  flaws,
  selectedFlawId,
  onSelectFlaw,
  seekTime,
}) => {
  const refContainerRef = useRef<HTMLDivElement>(null);
  const partContainerRef = useRef<HTMLDivElement>(null);

  const refWaveSurfer = useRef<WaveSurfer | null>(null);
  const partWaveSurfer = useRef<WaveSurfer | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeTrack, setActiveTrack] = useState<'participant' | 'reference' | 'both'>('participant');
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Initialize Reference WaveSurfer
  useEffect(() => {
    if (!refContainerRef.current) return;

    const wsRef = WaveSurfer.create({
      container: refContainerRef.current,
      waveColor: '#A6C8E0',
      progressColor: '#1F4E79',
      cursorColor: '#1F4E79',
      cursorWidth: 2,
      height: 64,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
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
      waveColor: '#E8B896',
      progressColor: '#C2571A',
      cursorColor: '#C2571A',
      cursorWidth: 2,
      height: 64,
      barWidth: 2,
      barGap: 2,
      barRadius: 2,
      normalize: true,
      url: participantAudioUrl,
    });

    partWaveSurfer.current = wsPart;

    wsPart.on('ready', () => {
      setDuration(wsPart.getDuration());
    });

    wsPart.on('timeupdate', (t) => {
      setCurrentTime(t);
    });

    wsPart.on('play', () => setIsPlaying(true));
    wsPart.on('pause', () => setIsPlaying(false));
    wsPart.on('finish', () => setIsPlaying(false));

    return () => {
      wsPart.destroy();
    };
  }, [participantAudioUrl]);

  // Synchronized seek handling
  useEffect(() => {
    if (seekTime !== null && seekTime !== undefined && duration > 0) {
      const targetProgress = Math.max(0, Math.min(1, seekTime / duration));
      if (partWaveSurfer.current) {
        partWaveSurfer.current.seekTo(targetProgress);
        partWaveSurfer.current.play();
      }
      if (refWaveSurfer.current) {
        refWaveSurfer.current.seekTo(targetProgress);
      }
    }
  }, [seekTime, duration]);

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
    const partWs = partWaveSurfer.current;
    const refWs = refWaveSurfer.current;

    if (!partWs || !refWs) return;

    if (isPlaying) {
      partWs.pause();
      refWs.pause();
    } else {
      if (activeTrack === 'participant') {
        refWs.pause();
        partWs.play();
      } else if (activeTrack === 'reference') {
        partWs.pause();
        refWs.play();
      } else {
        const time = partWs.getCurrentTime();
        refWs.setTime(time);
        refWs.play();
        partWs.play();
      }
    }
  };

  const handleRestart = () => {
    if (partWaveSurfer.current) {
      partWaveSurfer.current.seekTo(0);
      partWaveSurfer.current.play();
    }
    if (refWaveSurfer.current) {
      refWaveSurfer.current.seekTo(0);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
              Waveform Alignment & Flaw Markers
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface-2)] text-[var(--muted-foreground)] border border-[var(--border)]">
              Interactive
            </span>
          </div>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Click any flaw region or wave position to seek. Press <kbd className="px-1 py-0.5 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[10px] font-mono">Space</kbd> to toggle playback.
          </p>
        </div>

        {/* Track selector */}
        <div className="flex items-center rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-0.5 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTrack('participant');
              if (refWaveSurfer.current) refWaveSurfer.current.pause();
            }}
            className={`px-3 py-1 rounded transition-colors ${
              activeTrack === 'participant'
                ? 'bg-[var(--surface)] text-[var(--series-participant)] font-medium shadow-xs'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
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
            className={`px-3 py-1 rounded transition-colors ${
              activeTrack === 'reference'
                ? 'bg-[var(--surface)] text-[var(--series-ref)] font-medium shadow-xs'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            Reference
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTrack('both');
            }}
            className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
              activeTrack === 'both'
                ? 'bg-[var(--surface)] text-[var(--foreground)] font-medium shadow-xs'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
            title="Lock Playheads: Play both tracks simultaneously"
          >
            {activeTrack === 'both' ? <Lock className="w-3 h-3 text-[var(--accent)]" /> : <Unlock className="w-3 h-3" />}
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Waveform Displays */}
      <div className="space-y-4">
        {/* Reference Waveform */}
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1F4E79]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1F4E79]">
                Reference Delivery
              </span>
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">Baseline Archetype</span>
          </div>
          <div className="rounded bg-[var(--surface-2)] p-2">
            <div ref={refContainerRef} className="cursor-pointer" />
          </div>
        </div>

        {/* Participant Waveform with Flaws Overlay */}
        <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C2571A]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#C2571A]">
                Participant Delivery
              </span>
            </div>
            <span className="text-xs text-[var(--muted-foreground)]">
              {flaws.length} Flaw Region{flaws.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="relative rounded bg-[var(--surface-2)] p-2">
            <div ref={partContainerRef} className="cursor-pointer" />

            {/* Visual Flaw Overlay Bands */}
            {duration > 0 && (
              <div className="absolute inset-y-2 inset-x-2 pointer-events-none">
                {flaws.map((flaw) => {
                  const left = (flaw.start / duration) * 100;
                  const width = ((flaw.end - flaw.start) / duration) * 100;
                  const isSelected = selectedFlawId === flaw.id;

                  const colorClass =
                    flaw.severity === 'HIGH'
                      ? 'bg-rose-500/20 border-rose-500/70 text-rose-900'
                      : flaw.severity === 'MEDIUM'
                      ? 'bg-amber-500/20 border-amber-500/70 text-amber-900'
                      : 'bg-yellow-500/20 border-yellow-500/60 text-yellow-900';

                  return (
                    <div
                      key={flaw.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFlaw?.(flaw.id);
                      }}
                      style={{ left: `${left}%`, width: `${Math.max(1.8, width)}%` }}
                      className={`absolute top-0 bottom-0 pointer-events-auto cursor-pointer border-x transition-all group ${colorClass} ${
                        isSelected
                          ? 'ring-2 ring-[var(--foreground)] ring-offset-1 bg-rose-500/35 z-10'
                          : 'hover:brightness-95'
                      }`}
                      title={`${flaw.type} (${formatTime(flaw.start)} – ${formatTime(flaw.end)})`}
                    >
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] text-[11px] font-medium px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-20 transition-opacity">
                        {flaw.type.replace(/_/g, ' ')} (+{flaw.duration.toFixed(1)}s)
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
      <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={togglePlay}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs"
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
            className="p-2 text-xs"
            title="Restart from beginning"
            aria-label="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="secondary"
            onClick={toggleMute}
            className="p-2 text-xs"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5" />}
          </Button>

          {/* Time Readout */}
          <div className="font-mono text-xs px-2.5 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground)] ml-2">
            <span className="font-semibold">{formatTime(currentTime)}</span>
            <span className="text-[var(--muted-foreground)]"> / {formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback speed selector & legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <span className="text-[var(--muted-foreground)] mr-1">Speed:</span>
            {[0.75, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => handleRateChange(rate)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  playbackRate === rate
                    ? 'bg-[var(--accent)] text-white font-medium'
                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-[var(--muted-foreground)] border-l border-[var(--border)] pl-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/40 border border-rose-500" />
              <span>High Flaw</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/40 border border-amber-500" />
              <span>Medium</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
