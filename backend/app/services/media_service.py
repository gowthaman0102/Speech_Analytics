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

def get_ffmpeg_binary() -> str:
    """Finds the ffmpeg executable from settings, system PATH, or imageio_ffmpeg."""
    if settings.FFMPEG_PATH and os.path.exists(settings.FFMPEG_PATH):
        return settings.FFMPEG_PATH
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
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
        logger.error("FFmpeg error: %s", res.stderr)
        raise RuntimeError(f"FFmpeg failed to extract/convert audio from {input_path}: {res.stderr[:300]}")

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
