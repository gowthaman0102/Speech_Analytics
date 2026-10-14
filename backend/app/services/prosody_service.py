import logging
import numpy as np
import librosa
import soundfile as sf
from typing import List, Dict, Any, Tuple, Optional

logger = logging.getLogger(__name__)

def extract_global_audio_features(audio_path: str) -> Dict[str, Any]:
    """
    Extracts continuous F0 pitch, RMS energy, and timepoints across the entire audio stream.
    Also computes the speaker's personal vocal baseline for z-score normalization.
    """
    y, sr = sf.read(audio_path, dtype="float32")
    if y.ndim > 1:
        y = np.mean(y, axis=1)

    duration = float(len(y) / sr)
    hop_length = int(sr * 0.05)  # 50ms hop
    frame_times = librosa.frames_to_time(np.arange(len(y) // hop_length + 1), sr=sr, hop_length=hop_length)

    # 1. RMS Energy
    rms_frames = librosa.feature.rms(y=y, hop_length=hop_length)[0]
    # Match length with frame_times
    min_len = min(len(frame_times), len(rms_frames))
    frame_times = frame_times[:min_len]
    rms_frames = rms_frames[:min_len]

    # 2. Pitch / F0 via librosa pyin
    fmin = librosa.note_to_hz("C2")  # ~65 Hz
    fmax = librosa.note_to_hz("C6")  # ~1046 Hz
    try:
        f0_frames, voiced_flag, voiced_probs = librosa.pyin(
            y,
            fmin=fmin,
            fmax=fmax,
            sr=sr,
            hop_length=hop_length,
            fill_na=None
        )
        f0_frames = f0_frames[:min_len]
    except Exception as e:
        logger.warning("pYIN pitch tracking error: %s. Using heuristic pitch curve.", e)
        f0_frames = np.full(min_len, 140.0)

    # 3. Speaker Baseline Calculation (across voiced frames)
    voiced_pitches = [float(p) for p in f0_frames if p is not None and not np.isnan(p) and p > 40]
    if voiced_pitches:
        speaker_mean_f0 = float(np.mean(voiced_pitches))
        speaker_std_f0 = float(np.std(voiced_pitches))
    else:
        speaker_mean_f0 = 140.0
        speaker_std_f0 = 25.0

    valid_rms = [float(r) for r in rms_frames if r > 0.001]
    if valid_rms:
        speaker_mean_rms = float(np.mean(valid_rms))
        speaker_std_rms = float(np.std(valid_rms))
    else:
        speaker_mean_rms = 0.05
        speaker_std_rms = 0.02

    speaker_baseline = {
        "mean_f0": round(speaker_mean_f0, 1),
        "std_f0": round(speaker_std_f0, 1),
        "mean_rms": round(speaker_mean_rms, 4),
        "std_rms": round(speaker_std_rms, 4),
        "duration": round(duration, 2)
    }

    return {
        "sample_rate": sr,
        "duration": duration,
        "frame_times": frame_times,
        "f0_frames": f0_frames,
        "rms_frames": rms_frames,
        "speaker_baseline": speaker_baseline
    }

def extract_sentence_prosody_features(
    sentence: Dict[str, Any],
    global_features: Dict[str, Any],
    important_words: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Computes normalized sentence-level prosodic features relative to the speaker's baseline:
    pace, pitch variation, intonation slope, vocal energy, and important word emphasis.
    """
    s_start = sentence["start"]
    s_end = sentence["end"]
    frame_times = global_features["frame_times"]
    f0_frames = global_features["f0_frames"]
    rms_frames = global_features["rms_frames"]
    baseline = global_features["speaker_baseline"]

    # Slice frames inside sentence interval
    mask = (frame_times >= s_start) & (frame_times <= s_end)
    s_f0 = [f0_frames[i] for i in range(len(mask)) if mask[i] and f0_frames[i] is not None and not np.isnan(f0_frames[i])]
    s_rms = [rms_frames[i] for i in range(len(mask)) if mask[i]]

    # 1. Pitch Metrics
    if s_f0 and len(s_f0) >= 2:
        s_mean_f0 = float(np.mean(s_f0))
        s_std_f0 = float(np.std(s_f0))
        # Normalized pitch variation relative to mean (coefficient of variation)
        pitch_variation = float(s_std_f0 / max(1.0, s_mean_f0))

        # Intonation slope (overall trend from start to end of sentence)
        x_pts = np.linspace(0, 1, len(s_f0))
        slope, _ = np.polyfit(x_pts, s_f0, 1)

        # Final pitch movement (last 25% of sentence frames for question intonation)
        tail_len = max(2, int(len(s_f0) * 0.25))
        tail_f0 = s_f0[-tail_len:]
        head_f0 = s_f0[:tail_len]
        final_pitch_delta = float(np.mean(tail_f0) - np.mean(head_f0))
    else:
        s_mean_f0 = baseline["mean_f0"]
        s_std_f0 = baseline["std_f0"]
        pitch_variation = float(s_std_f0 / max(1.0, s_mean_f0))
        slope = 0.0
        final_pitch_delta = 0.0

    # 2. Energy Metrics
    if s_rms:
        raw_mean_rms = float(np.mean(s_rms))
        # Relative normalized energy (0 to 1 scale centered around speaker's baseline)
        z_energy = (raw_mean_rms - baseline["mean_rms"]) / max(0.001, baseline["std_rms"])
        # Sigmoid map to [0, 1] with 0.6 at baseline
        normalized_energy = 1.0 / (1.0 + np.exp(-0.8 * z_energy))
        energy_variance = float(np.std(s_rms) / max(0.001, raw_mean_rms))
    else:
        raw_mean_rms = baseline["mean_rms"]
        normalized_energy = 0.55
        energy_variance = 0.20

    # 3. Important Word Emphasis Prominence
    emphasis_prominence = 0.0
    if important_words and s_rms:
        word_prominences = []
        for kw in important_words:
            w_start, w_end = kw["start"], kw["end"]
            w_mask = (frame_times >= w_start) & (frame_times <= w_end)
            w_rms = [rms_frames[i] for i in range(len(w_mask)) if w_mask[i]]
            if w_rms:
                w_energy = float(np.mean(w_rms))
                # How much higher is this keyword's energy compared to the sentence average?
                delta_ratio = (w_energy - raw_mean_rms) / max(0.001, raw_mean_rms)
                word_prominences.append(delta_ratio)
        if word_prominences:
            emphasis_prominence = float(max(word_prominences))

    return {
        "speech_rate_wpm": sentence.get("speech_rate_wpm", 135.0),
        "mean_pitch_hz": round(s_mean_f0, 1),
        "pitch_variation": round(pitch_variation, 3),
        "pitch_slope": round(float(slope), 2),
        "final_pitch_delta_hz": round(final_pitch_delta, 1),
        "normalized_energy": round(float(normalized_energy), 3),
        "energy_variance": round(float(energy_variance), 3),
        "pause_before": sentence.get("pause_before", 0.3),
        "pause_after": sentence.get("pause_after", 0.3),
        "emphasis_strength": round(max(0.0, float(emphasis_prominence)), 3)
    }
