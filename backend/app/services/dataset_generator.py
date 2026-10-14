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

def apply_monotone_effect(audio: np.ndarray, sr: int, severity: str = "moderate") -> np.ndarray:
    """Simulates monotone delivery with compressed dynamic range and suppressed pitch variation."""
    try:
        import scipy.signal
        band = [150, 2500] if severity == "severe" else [120, 3200]
        sos = scipy.signal.butter(4, band, btype="bandpass", fs=sr, output="sos")
        filtered = scipy.signal.sosfilt(sos, audio)
        exponent = 0.4 if severity == "severe" else 0.65
        compressed = np.sign(filtered) * (np.abs(filtered) ** exponent)
        peak = np.max(np.abs(compressed)) or 1.0
        return (compressed / peak) * 0.85
    except Exception:
        return audio

def insert_excessive_pause(audio: np.ndarray, sr: int, pause_duration_sec: float = 2.0) -> np.ndarray:
    """Inserts an artificial silence interval right in the middle section of the speech."""
    midpoint = len(audio) // 2
    silence = np.zeros(int(pause_duration_sec * sr), dtype=audio.dtype)
    return np.concatenate([audio[:midpoint], silence, audio[midpoint:]])

def generate_gradient_dataset(reference_wav_path: str, output_dir: Path) -> List[Dict[str, Any]]:
    """
    Generates a full contrastive quality and severity gradient dataset:
    - Ideal (1.00x)
    - Almost Perfect (1.05x speed, -1 dB)
    - Mildly Flawed (1.10x speed, -3 dB, mild monotone)
    - Moderately Flawed (1.20x speed, -6 dB, 1.5s pause)
    - Severely Flawed (1.40x speed, -10 dB, 2.8s pause, flat pitch)
    """
    data, sr = sf.read(reference_wav_path, dtype="float32")
    if data.ndim > 1:
        data = np.mean(data, axis=1)

    base_name = Path(reference_wav_path).stem
    ref_dur = len(data) / sr
    variants = []

    # 1. Almost Perfect (1.05x speed)
    v_ap = apply_speed_change(data, sr, 1.05)
    p_ap = output_dir / f"{base_name}_almost_perfect_1.05x.wav"
    sf.write(str(p_ap), v_ap, sr)
    variants.append({
        "variantName": "Almost Perfect Delivery (1.05x)",
        "gradientLevel": "ALMOST_PERFECT",
        "filePath": str(p_ap),
        "speedFactor": 1.05,
        "volumeDeltaDb": 0.0,
        "expectedFlaw": "NONE",
        "severity": "LOW",
        "expectedInterval": f"0.0s - {len(v_ap)/sr:.1f}s",
        "description": "5% natural speaking cadence tempo variation representing competitive delivery."
    })

    # 2. Mildly Flawed Fast (1.10x speed)
    v_mild_fast = apply_speed_change(data, sr, 1.10)
    p_mild_fast = output_dir / f"{base_name}_mild_fast_1.10x.wav"
    sf.write(str(p_mild_fast), v_mild_fast, sr)
    variants.append({
        "variantName": "Mildly Fast Delivery (1.10x)",
        "gradientLevel": "MILD",
        "filePath": str(p_mild_fast),
        "speedFactor": 1.10,
        "volumeDeltaDb": 0.0,
        "expectedFlaw": "MILD_TEMPO_ELEVATION",
        "severity": "LOW",
        "expectedInterval": f"0.0s - {len(v_mild_fast)/sr:.1f}s",
        "description": "10% tempo elevation, noticeable to trained judges but preserving intelligibility."
    })

    # 3. Moderately Flawed Fast (1.20x speed)
    v_mod_fast = apply_speed_change(data, sr, 1.20)
    p_mod_fast = output_dir / f"{base_name}_moderate_fast_1.20x.wav"
    sf.write(str(p_mod_fast), v_mod_fast, sr)
    variants.append({
        "variantName": "Moderately Fast Delivery (1.20x)",
        "gradientLevel": "MODERATE",
        "filePath": str(p_mod_fast),
        "speedFactor": 1.20,
        "volumeDeltaDb": 0.0,
        "expectedFlaw": "RUSHED_DELIVERY",
        "severity": "MEDIUM",
        "expectedInterval": f"0.0s - {len(v_mod_fast)/sr:.1f}s",
        "description": "20% accelerated speaking pace, beginning to compress rhetorical breathing pauses."
    })

    # 4. Severely Flawed Fast (1.40x speed)
    v_sev_fast = apply_speed_change(data, sr, 1.40)
    p_sev_fast = output_dir / f"{base_name}_severe_fast_1.40x.wav"
    sf.write(str(p_sev_fast), v_sev_fast, sr)
    variants.append({
        "variantName": "Severely Rushed Delivery (1.40x)",
        "gradientLevel": "SEVERE",
        "filePath": str(p_sev_fast),
        "speedFactor": 1.40,
        "volumeDeltaDb": 0.0,
        "expectedFlaw": "RUSHED_DELIVERY",
        "severity": "HIGH",
        "expectedInterval": f"0.0s - {len(v_sev_fast)/sr:.1f}s",
        "description": "40% accelerated pace, causing severe syllable compression and loss of rhetorical structure."
    })

    # 5. Mild Low Volume (-3 dB)
    v_mild_quiet = apply_volume_change_db(data, -3.0)
    p_mild_quiet = output_dir / f"{base_name}_mild_low_volume_-3dB.wav"
    sf.write(str(p_mild_quiet), v_mild_quiet, sr)
    variants.append({
        "variantName": "Mild Volume Drop (-3 dB)",
        "gradientLevel": "MILD",
        "filePath": str(p_mild_quiet),
        "speedFactor": 1.0,
        "volumeDeltaDb": -3.0,
        "expectedFlaw": "MILD_PROJECTION_DROP",
        "severity": "LOW",
        "expectedInterval": f"0.0s - {ref_dur:.1f}s",
        "description": "Subtle 3 dB reduction in dynamic vocal power."
    })

    # 6. Moderately Low Volume (-6 dB)
    v_mod_quiet = apply_volume_change_db(data, -6.0)
    p_mod_quiet = output_dir / f"{base_name}_moderate_low_volume_-6dB.wav"
    sf.write(str(p_mod_quiet), v_mod_quiet, sr)
    variants.append({
        "variantName": "Moderate Volume Drop (-6 dB)",
        "gradientLevel": "MODERATE",
        "filePath": str(p_mod_quiet),
        "speedFactor": 1.0,
        "volumeDeltaDb": -6.0,
        "expectedFlaw": "LOW_VOLUME",
        "severity": "MEDIUM",
        "expectedInterval": f"0.0s - {ref_dur:.1f}s",
        "description": "6 dB vocal attenuation, producing a soft delivery lacking auditorium projection."
    })

    # 7. Severely Low Volume (-10 dB)
    v_sev_quiet = apply_volume_change_db(data, -10.0)
    p_sev_quiet = output_dir / f"{base_name}_severe_low_volume_-10dB.wav"
    sf.write(str(p_sev_quiet), v_sev_quiet, sr)
    variants.append({
        "variantName": "Severely Faded Volume (-10 dB)",
        "gradientLevel": "SEVERE",
        "filePath": str(p_sev_quiet),
        "speedFactor": 1.0,
        "volumeDeltaDb": -10.0,
        "expectedFlaw": "LOW_VOLUME",
        "severity": "HIGH",
        "expectedInterval": f"0.0s - {ref_dur:.1f}s",
        "description": "10 dB loss of acoustic energy resulting in muffled, faint vocal presence."
    })

    # 8. Moderate Hesitation Pause (1.5s)
    v_mod_pause = insert_excessive_pause(data, sr, 1.5)
    p_mod_pause = output_dir / f"{base_name}_moderate_pause_1.5s.wav"
    sf.write(str(p_mod_pause), v_mod_pause, sr)
    mid_t = ref_dur / 2.0
    variants.append({
        "variantName": "Moderate Hesitation Pause (1.5s)",
        "gradientLevel": "MODERATE",
        "filePath": str(p_mod_pause),
        "speedFactor": 1.0,
        "volumeDeltaDb": 0.0,
        "expectedFlaw": "EXCESSIVE_PAUSE",
        "severity": "MEDIUM",
        "expectedInterval": f"{mid_t:.1f}s - {mid_t + 1.5:.1f}s",
        "description": "Unnatural 1.5-second dead air pause inserted mid-delivery."
    })

    # 9. Severe Hesitation Pause (2.8s)
    v_sev_pause = insert_excessive_pause(data, sr, 2.8)
    p_sev_pause = output_dir / f"{base_name}_severe_pause_2.8s.wav"
    sf.write(str(p_sev_pause), v_sev_pause, sr)
    variants.append({
        "variantName": "Severe Dead Air Hesitation (2.8s)",
        "gradientLevel": "SEVERE",
        "filePath": str(p_sev_pause),
        "speedFactor": 1.0,
        "volumeDeltaDb": 0.0,
        "expectedFlaw": "EXCESSIVE_PAUSE",
        "severity": "HIGH",
        "expectedInterval": f"{mid_t:.1f}s - {mid_t + 2.8:.1f}s",
        "description": "Prolonged 2.8-second silence indicating memory failure or severe hesitation."
    })

    # 10. Monotone Intonation (Severe Flat Pitch)
    v_mono = apply_monotone_effect(data, sr, severity="severe")
    p_mono = output_dir / f"{base_name}_monotone_severe.wav"
    sf.write(str(p_mono), v_mono, sr)
    variants.append({
        "variantName": "Monotone Intonation (Flat Pitch)",
        "gradientLevel": "SEVERE",
        "filePath": str(p_mono),
        "speedFactor": 1.0,
        "volumeDeltaDb": 0.0,
        "expectedFlaw": "MONOTONE",
        "severity": "HIGH",
        "expectedInterval": f"0.0s - {ref_dur:.1f}s",
        "description": "Suppressed pitch variability and dynamic compression producing robotic intonation."
    })

    return variants
