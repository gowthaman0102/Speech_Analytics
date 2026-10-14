import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Play, Pause, RotateCcw, Volume2, VolumeX, AlertTriangle, FastForward } from 'lucide-react';
import { FlawSegment } from '../types';

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
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Initialize Reference WaveSurfer
  useEffect(() => {
    if (!refContainerRef.current) return;

    const wsRef = WaveSurfer.create({
      container: refContainerRef.current,
      waveColor: '#475569',
      progressColor: '#38bdf8',
      cursorColor: '#38bdf8',
      cursorWidth: 2,
      height: 72,
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
      waveColor: '#64748b',
      progressColor: '#f43f5e',
      cursorColor: '#f43f5e',
      cursorWidth: 2,
      height: 72,
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

  // Handle external seek request (e.g. user clicked a flaw in timeline)
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
        // synchronized
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

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white tracking-tight">Audio Waveform & Flaw Alignment</h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Interactive Audio
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Click any flaw marker or waveform region to scrub and listen to the acoustic difference
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-3">
          {/* Track selector */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => {
                setActiveTrack('participant');
                if (refWaveSurfer.current) refWaveSurfer.current.pause();
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTrack === 'participant' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Participant
            </button>
            <button
              onClick={() => {
                setActiveTrack('reference');
                if (partWaveSurfer.current) partWaveSurfer.current.pause();
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeTrack === 'reference' ? 'bg-cyan-500 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Reference
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Restart"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={togglePlay}
              className={`p-3 rounded-xl font-bold flex items-center justify-center transition-all ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20'
              }`}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
            </button>
            <button
              onClick={toggleMute}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          <div className="font-mono text-xs px-3 py-2 bg-slate-950 rounded-lg border border-slate-800 text-slate-300">
            <span className="text-white font-bold">{formatTime(currentTime)}</span>
            <span className="text-slate-500"> / {formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Waveforms */}
      <div className="space-y-4">
        {/* Reference Waveform */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Reference / Baseline Audio</span>
            </div>
            <span className="text-[11px] text-slate-400">Target Acoustic Archetype</span>
          </div>
          <div ref={refContainerRef} className="cursor-pointer" />
        </div>

        {/* Participant Waveform with Flaw Overlay */}
        <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Participant Performance Audio</span>
            </div>
            <span className="text-[11px] text-slate-400">{flaws.length} Flaw Regions Identified</span>
          </div>

          <div className="relative">
            <div ref={partContainerRef} className="cursor-pointer" />

            {/* Visual Flaw Overlay Bands */}
            {duration > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {flaws.map((flaw) => {
                  const left = (flaw.start / duration) * 100;
                  const width = ((flaw.end - flaw.start) / duration) * 100;
                  const isSelected = selectedFlawId === flaw.id;

                  const colorClass =
                    flaw.severity === 'HIGH'
                      ? 'bg-rose-500/25 border-rose-500/60'
                      : flaw.severity === 'MEDIUM'
                      ? 'bg-amber-500/25 border-amber-500/60'
                      : 'bg-yellow-500/20 border-yellow-500/50';

                  return (
                    <div
                      key={flaw.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFlaw?.(flaw.id);
                      }}
                      style={{ left: `${left}%`, width: `${Math.max(1.5, width)}%` }}
                      className={`absolute top-0 bottom-0 pointer-events-auto cursor-pointer border-x transition-all group ${colorClass} ${
                        isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 bg-rose-500/40 z-10' : ''
                      }`}
                      title={`${flaw.type} (${formatTime(flaw.start)} - ${formatTime(flaw.end)})`}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-lg whitespace-nowrap z-20 transition-opacity">
                        {flaw.type.replace(/_/g, ' ')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-rose-500/40 border border-rose-500" />
            <span>High Severity Flaw</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-500/40 border border-amber-500" />
            <span>Medium Severity</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-yellow-500/40 border border-yellow-500" />
            <span>Low Severity</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500">
          Normalized reference and participant timelines synchronized via Dynamic Time Warping (DTW)
        </p>
      </div>
    </div>
  );
};
