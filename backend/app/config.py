import os
import shutil
from pathlib import Path
from typing import Dict
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseModel):
    APP_NAME: str = "SpeechScope AI"
    APP_TAGLINE: str = "Temporal Contrastive Speech Coach"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'speechscope.db'}")
    
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    PROCESSED_DIR: Path = BASE_DIR / "processed"
    DATASET_DIR: Path = BASE_DIR / "dataset"
    
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")
    MAX_AUDIO_DURATION: int = int(os.getenv("MAX_AUDIO_DURATION", "600"))  # 10 minutes in seconds
    
    ENABLE_WHISPERX: bool = os.getenv("ENABLE_WHISPERX", "false").lower() == "true"
    ENABLE_LLM_FEEDBACK: bool = os.getenv("ENABLE_LLM_FEEDBACK", "false").lower() == "true"
    
    # Composite deviation feature weights (sum = 1.00)
    WEIGHT_PITCH: float = 0.25
    WEIGHT_ENERGY: float = 0.15
    WEIGHT_RATE: float = 0.25
    WEIGHT_PAUSE: float = 0.20
    WEIGHT_MFCC: float = 0.15
    
    # Configurable detection thresholds for 4 core delivery flaws
    PACE_DEVIATION_THRESHOLD: float = float(os.getenv("PACE_DEVIATION_THRESHOLD", "0.25"))    # 25% WPM delta
    PITCH_VARIANCE_THRESHOLD: float = float(os.getenv("PITCH_VARIANCE_THRESHOLD", "0.35"))    # 35% pitch spread reduction
    PAUSE_DEVIATION_THRESHOLD: float = float(os.getenv("PAUSE_DEVIATION_THRESHOLD", "0.40"))  # 0.40s pause mismatch
    ENERGY_DEVIATION_THRESHOLD: float = float(os.getenv("ENERGY_DEVIATION_THRESHOLD", "0.30"))# 30% RMS energy delta
    
    FLAW_COMPOSITE_THRESHOLD: float = float(os.getenv("FLAW_COMPOSITE_THRESHOLD", "0.32"))
    FLAW_MIN_DURATION_SEC: float = float(os.getenv("FLAW_MIN_DURATION_SEC", "0.40"))         # minimum candidate length
    FLAW_MERGE_GAP_SEC: float = float(os.getenv("FLAW_MERGE_GAP_SEC", "0.50"))               # merge adjacent intervals
    
    # Configurable Rubric Weights (sum = 1.00)
    RUBRIC_WEIGHTS: Dict[str, float] = {
        "pace": 0.20,
        "pitch": 0.20,
        "pause": 0.15,
        "energy": 0.15,
        "clarity": 0.15,
        "delivery": 0.15
    }

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
(settings.DATASET_DIR / "good").mkdir(parents=True, exist_ok=True)
(settings.DATASET_DIR / "flawed").mkdir(parents=True, exist_ok=True)
(settings.DATASET_DIR / "labels").mkdir(parents=True, exist_ok=True)

def find_ffmpeg_path() -> str | None:
    """Finds ffmpeg path from PATH, environment, winget locations, or imageio_ffmpeg."""
    ffmpeg_in_path = shutil.which("ffmpeg")
    if ffmpeg_in_path:
        return ffmpeg_in_path
    
    known_candidates = [
        Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WinGet" / "Links" / "ffmpeg.exe",
        Path("C:/Users/GOWTHAMAN.S/AppData/Local/Microsoft/WinGet/Links/ffmpeg.exe"),
        Path(os.environ.get("LOCALAPPDATA", "")) / "Microsoft" / "WinGet" / "Packages" / "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe" / "ffmpeg-9.0.2-full_build" / "bin" / "ffmpeg.exe"
    ]
    for candidate in known_candidates:
        if candidate.exists():
            return str(candidate)
    
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and os.path.exists(exe):
            return exe
    except Exception:
        pass
    
    return None

FFMPEG_PATH = find_ffmpeg_path()
if FFMPEG_PATH:
    os.environ["PATH"] = os.path.dirname(FFMPEG_PATH) + os.pathsep + os.environ.get("PATH", "")
    try:
        from pydub import AudioSegment
        AudioSegment.converter = FFMPEG_PATH
    except Exception:
        pass
