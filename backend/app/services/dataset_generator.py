import os
import json
import uuid
import numpy as np
import soundfile as sf
from pathlib import Path
from typing import Dict, Any, List
from ..config import settings

def apply_speed_change(audio: np.ndarray, sr: int, factor: float) -> np.ndarray:
    """Modifies playback speed using librosa time stretch or high-quality interpolation."""
    try:
        import librosa
        return librosa.effects.time_stretch(y=audio, rate=factor)
    except Exception:
        # Resampling fallback
        import scipy.signal
        new_len = int(len(audio) / factor)
        return scipy.signal.resample(audio, new_len)

def apply_pitch_shift(audio: np.ndarray, sr: int, n_steps: float) -> np.ndarray:
    """Shifts pitch up or down by n semitones."""
    try:
        import librosa
        return librosa.effects.pitch_shift(y=audio, sr=sr, n_steps=n_steps)
    except Exception:
        return audio

def apply_volume_change_db(audio: np.ndarray, db: float) -> np.ndarray:
    """Alters gain by dB."""
    scale = 10.0 ** (db / 20.0)
    return np.clip(audio * scale, -1.0, 1.0)

def apply_monotone_effect(audio: np.ndarray, sr: int) -> np.ndarray:
    """
    Simulates monotone by reducing frequency modulation in voiced bands
    and flattening amplitude dynamics.
    """
    try:
        import scipy.signal
        # Apply a subtle bandpass filter and dynamic compression to simulate flat delivery
        sos = scipy.signal.butter(4, [100, 3000], btype="bandpass", fs=sr, output="sos")
        filtered = scipy.signal.sosfilt(sos, audio)
        # Dynamic range compression
        compressed = np.sign(filtered) * (np.abs(filtered) ** 0.6)
        # Normalize
        peak = np.max(np.abs(compressed)) or 1.0
        return (compressed / peak) * 0.85
    except Exception:
        return audio

def insert_excessive_pause(audio: np.ndarray, sr: int, pause_duration_sec: float = 2.0) -> np.ndarray:
    """Inserts a period of complete silence right in the middle section of the speech."""
    midpoint = len(audio) // 2
    silence = np.zeros(int(pause_duration_sec * sr), dtype=audio.dtype)
    return np.concatenate([audio[:midpoint], silence, audio[midpoint:]])

def remove_middle_silences(audio: np.ndarray, sr: int) -> np.ndarray:
    """Removes natural pauses by splicing continuous high-energy parts."""
    # Split by energy threshold and concatenate back
    hop = int(0.05 * sr)
    frame = int(0.1 * sr)
    energies = [np.mean(audio[i:i+frame]**2) for i in range(0, len(audio) - frame, hop)]
    thresh = 0.15 * np.mean(energies)
    keep_samples = []
    for i, e in enumerate(energies):
        if e >= thresh:
            start = i * hop
            keep_samples.append(audio[start:start+hop])
    if keep_samples:
        return np.concatenate(keep_samples)
    return audio

def generate_flawed_variants(reference_wav_path: str, output_dir: Path) -> List[Dict[str, Any]]:
    """
    Generates a contrastive suite of flawed audio variants with exact labels.
    """
    data, sr = sf.read(reference_wav_path, dtype="float32")
    if data.ndim > 1:
        data = np.mean(data, axis=1)

    variants_meta = []
    base_name = Path(reference_wav_path).stem

    # 1. Rushed Delivery (1.35x speed)
    fast_audio = apply_speed_change(data, sr, 1.35)
    fast_path = output_dir / f"{base_name}_rushed_1.35x.wav"
    sf.write(str(fast_path), fast_audio, sr)
    variants_meta.append({
        "variantName": "Rushed Delivery (1.35x)",
        "filePath": str(fast_path),
        "expectedFlaw": "RUSHED_DELIVERY",
        "severity": "HIGH",
        "description": "Artificially accelerated speech cadence (+35% speed), decreasing rhetorical pause duration."
    })

    # 2. Slow Delivery (0.75x speed)
    slow_audio = apply_speed_change(data, sr, 0.75)
    slow_path = output_dir / f"{base_name}_slow_0.75x.wav"
    sf.write(str(slow_path), slow_audio, sr)
    variants_meta.append({
        "variantName": "Slow Delivery (0.75x)",
        "filePath": str(slow_path),
        "expectedFlaw": "SLOW_DELIVERY",
        "severity": "HIGH",
        "description": "Significantly dragged pace (-25% speed), elongating vowel phonemes and losing momentum."
    })

    # 3. Low Volume (-10 dB)
    quiet_audio = apply_volume_change_db(data, -10.0)
    quiet_path = output_dir / f"{base_name}_low_volume_-10dB.wav"
    sf.write(str(quiet_path), quiet_audio, sr)
    variants_meta.append({
        "variantName": "Low Volume Projection (-10 dB)",
        "filePath": str(quiet_path),
        "expectedFlaw": "LOW_VOLUME",
        "severity": "HIGH",
        "description": "10 dB acoustic attenuation creating faint vocal presence and degraded audibility."
    })

    # 4. Excessive Pause (2.0s silence inserted)
    pause_audio = insert_excessive_pause(data, sr, pause_duration_sec=2.2)
    pause_path = output_dir / f"{base_name}_excessive_pause.wav"
    sf.write(str(pause_path), pause_audio, sr)
    variants_meta.append({
        "variantName": "Excessive Pause Hesitation (2.2s)",
        "filePath": str(pause_path),
        "expectedFlaw": "EXCESSIVE_PAUSE",
        "severity": "HIGH",
        "description": "Unnatural 2.2-second dead air inserted mid-speech, breaking rhetorical continuity."
    })

    # 5. Monotone Delivery (compressed modulation)
    flat_audio = apply_monotone_effect(data, sr)
    flat_path = output_dir / f"{base_name}_monotone.wav"
    sf.write(str(flat_path), flat_audio, sr)
    variants_meta.append({
        "variantName": "Monotone Intonation",
        "filePath": str(flat_path),
        "expectedFlaw": "MONOTONE",
        "severity": "MEDIUM",
        "description": "Suppressed pitch variability and dynamic compression creating a flat contour."
    })

    # 6. Near-Perfect Delivery (1.04x slight variation)
    near_perfect = apply_speed_change(data, sr, 1.04)
    np_path = output_dir / f"{base_name}_near_perfect_1.04x.wav"
    sf.write(str(np_path), near_perfect, sr)
    variants_meta.append({
        "variantName": "Near-Perfect Delivery (1.04x)",
        "filePath": str(np_path),
        "expectedFlaw": "NONE",
        "severity": "LOW",
        "description": "Mild 4% natural tempo variation representing an excellent competitive delivery."
    })

    return variants_meta
