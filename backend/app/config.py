import os
import shutil
import logging
from pathlib import Path
from typing import Dict, List, Optional
from pydantic import BaseModel
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env file if present
env_file = BASE_DIR / ".env"
if env_file.exists():
    load_dotenv(env_file)

class Settings(BaseModel):
    APP_NAME: str = "SpeechScope"
    APP_TAGLINE: str = "Objective, timestamped feedback on speech delivery."
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'speechscope.db'}")
    
    UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", str(BASE_DIR / "uploads")))
    PROCESSED_DIR: Path = Path(os.getenv("PROCESSED_DIR", str(BASE_DIR / "processed")))
    DATASET_DIR: Path = Path(os.getenv("DATASET_DIR", str(BASE_DIR / "dataset")))
    
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")
    FFMPEG_PATH: Optional[str] = os.getenv("FFMPEG_PATH")
    MAX_AUDIO_DURATION: int = int(os.getenv("MAX_AUDIO_DURATION", "600"))  # 10 minutes in seconds
    MAX_FILE_SIZE_BYTES: int = int(os.getenv("MAX_FILE_SIZE_BYTES", str(50 * 1024 * 1024))) # 50 MB
    
    ALLOWED_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000").split(",")
        if origin.strip()
    ]
    
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
    """Finds ffmpeg path from FFMPEG_PATH env var, system PATH, or imageio_ffmpeg."""
    env_ffmpeg = os.getenv("FFMPEG_PATH")
    if env_ffmpeg and os.path.exists(env_ffmpeg):
        return env_ffmpeg
        
    ffmpeg_in_path = shutil.which("ffmpeg")
    if ffmpeg_in_path:
        return ffmpeg_in_path
    
    try:
        import imageio_ffmpeg
        exe = imageio_ffmpeg.get_ffmpeg_exe()
        if exe and os.path.exists(exe):
            return exe
    except Exception:
        pass
    
    logger.warning("FFmpeg executable not found on system PATH, FFMPEG_PATH, or imageio-ffmpeg. Audio conversion may fail.")
    return None

FFMPEG_PATH = find_ffmpeg_path()
if FFMPEG_PATH:
    os.environ["PATH"] = os.path.dirname(FFMPEG_PATH) + os.pathsep + os.environ.get("PATH", "")
    try:
        from pydub import AudioSegment
        AudioSegment.converter = FFMPEG_PATH
    except Exception:
        pass
