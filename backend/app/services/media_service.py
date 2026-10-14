import os
import subprocess
import logging
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import soundfile as sf
from ..config import settings

logger = logging.getLogger(__name__)

VIDEO_EXTENSIONS = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"}
AUDIO_EXTENSIONS = {".wav", ".mp3", ".m4a", ".flac", ".aac", ".ogg"}

import shutil

def get_ffmpeg_binary() -> str:
    """Finds the ffmpeg executable from settings, imageio_ffmpeg, or system PATH."""
    custom_path = getattr(settings, "FFMPEG_PATH", None) or os.getenv("FFMPEG_PATH")
    if custom_path and os.path.exists(custom_path):
        return custom_path
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and os.path.exists(exe):
            return exe
    except Exception:
        pass
    which_ffmpeg = shutil.which("ffmpeg")
    if which_ffmpeg:
        return which_ffmpeg
    return "ffmpeg"

def process_input_media(input_path: str, output_dir: Optional[str] = None) -> Dict[str, Any]:
    """
    Takes an uploaded audio or video file, extracts/normalizes audio to
    16kHz Mono 16-bit PCM WAV, and returns metadata.
    """
    p = Path(input_path)
    if not p.exists():
        raise FileNotFoundError(f"Input media file not found: {input_path}")

    ext = p.suffix.lower()
    is_video = ext in VIDEO_EXTENSIONS

    if not output_dir:
        output_dir = str(settings.PROCESSED_DIR)
    os.makedirs(output_dir, exist_ok=True)

    target_wav_path = os.path.join(output_dir, f"{p.stem}_mono16k.wav")

    # If it is already a 16kHz mono WAV, check if conversion is needed
    if ext == ".wav":
        try:
            info = sf.info(input_path)
            if info.samplerate == 16000 and info.channels == 1:
                return {
                    "audio_path": input_path,
                    "is_video": False,
                    "duration": info.duration,
                    "sample_rate": 16000,
                    "channels": 1,
                    "original_path": input_path
                }
        except Exception as e:
            logger.warning("Could not read WAV info directly: %s. Re-encoding via ffmpeg.", e)

    # Use ffmpeg to extract/transcode audio
    ffmpeg_exe = get_ffmpeg_binary()
    cmd = [
        ffmpeg_exe,
        "-y",
        "-i", str(input_path),
        "-vn",                   # Drop video stream
        "-acodec", "pcm_s16le",  # 16-bit PCM
        "-ar", "16000",          # 16 kHz
        "-ac", "1",              # Mono
        str(target_wav_path)
    ]

    logger.info("Executing audio extraction/conversion: %s", " ".join(cmd))
    res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if res.returncode != 0:
        logger.warning("FFmpeg command failed: %s", res.stderr)
        # If this is an audio file (e.g. mp3, flac, ogg, etc.), attempt librosa fallback
        if not is_video:
            try:
                import librosa
                logger.info("Attempting audio load via librosa fallback for %s", input_path)
                y, sr = librosa.load(input_path, sr=16000, mono=True)
                sf.write(target_wav_path, y, 16000, subtype="PCM_16")
                dur = float(len(y)) / 16000.0
                return {
                    "audio_path": target_wav_path,
                    "is_video": False,
                    "duration": dur,
                    "sample_rate": 16000,
                    "channels": 1,
                    "original_path": input_path
                }
            except Exception as lib_err:
                logger.error("Librosa fallback also failed: %s", lib_err)
                raise RuntimeError(f"Failed to decode audio: {res.stderr[:200]}; fallback: {lib_err}")
        else:
            raise RuntimeError(f"FFmpeg failed to extract audio from video {input_path}: {res.stderr[:300]}")

    if not os.path.exists(target_wav_path):
        raise RuntimeError(f"Transcoded audio file was not created: {target_wav_path}")

    info = sf.info(target_wav_path)
    return {
        "audio_path": target_wav_path,
        "is_video": is_video,
        "duration": info.duration,
        "sample_rate": 16000,
        "channels": 1,
        "original_path": input_path
    }
