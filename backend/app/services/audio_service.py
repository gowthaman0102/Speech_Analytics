import os
import shutil
import uuid
import numpy as np
import soundfile as sf
from pathlib import Path
from typing import Tuple, Dict, Any
from ..config import settings, find_ffmpeg_path

# Ensure ffmpeg configured
find_ffmpeg_path()

def convert_and_preprocess_audio(input_file_path: str, output_prefix: str = "proc") -> Dict[str, Any]:
    """
    Takes an input audio file (.wav, .mp3, .m4a, .flac) and converts it to:
    - 16 kHz
    - Mono
    - 16-bit PCM WAV
    Performs peak amplitude normalization and calculates duration.
    Never destroys the original file.
    """
    input_path = Path(input_file_path)
    if not input_path.exists():
        raise FileNotFoundError(f"Input audio file not found: {input_file_path}")

    unique_id = uuid.uuid4().hex[:10]
    output_filename = f"{output_prefix}_{unique_id}.wav"
    output_path = settings.PROCESSED_DIR / output_filename

    audio_data = None
    sr = 16000

    # Strategy 1: soundfile directly (works for WAV, FLAC, OGG, and newer libsndfile MP3)
    try:
        data, file_sr = sf.read(str(input_path), dtype="float32")
        if data.ndim > 1:
            data = np.mean(data, axis=1)  # Convert to mono
        if file_sr != sr:
            import scipy.signal
            num_samples = int(round(len(data) * float(sr) / file_sr))
            data = scipy.signal.resample(data, num_samples)
        audio_data = data
    except Exception:
        # Strategy 2: pydub
        try:
            from pydub import AudioSegment
            seg = AudioSegment.from_file(str(input_path))
            seg = seg.set_frame_rate(sr).set_channels(1)
            raw = np.array(seg.get_array_of_samples(), dtype=np.float32)
            # Normalize int sample values to [-1.0, 1.0]
            max_val = float(1 << (8 * seg.sample_width - 1))
            audio_data = raw / max_val
        except Exception as e:
            # Strategy 3: librosa if available
            try:
                import librosa
                data, _ = librosa.load(str(input_path), sr=sr, mono=True)
                audio_data = data
            except Exception as e2:
                raise RuntimeError(f"Failed to read audio file {input_path.name}: {str(e2)}")

    if audio_data is None or len(audio_data) == 0:
        raise ValueError("Audio file contains no data or could not be decoded.")

    # Amplitude normalization (peak normalize to -1 dB, approx 0.89 amplitude)
    peak = np.max(np.abs(audio_data))
    if peak > 1e-4:
        target_peak = 0.891  # -1 dBFS
        audio_data = audio_data * (target_peak / peak)

    # Calculate duration
    duration = float(len(audio_data)) / float(sr)
    if duration > settings.MAX_AUDIO_DURATION:
        raise ValueError(f"Audio duration {duration:.1f}s exceeds maximum allowed {settings.MAX_AUDIO_DURATION}s")

    # Write out standardized WAV
    sf.write(str(output_path), audio_data, sr, subtype="PCM_16")

    return {
        "processed_path": str(output_path),
        "duration": duration,
        "sample_rate": sr,
        "channels": 1,
        "samples_count": len(audio_data),
        "peak_amplitude": float(np.max(np.abs(audio_data)))
    }
