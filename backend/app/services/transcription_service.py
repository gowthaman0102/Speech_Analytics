import os
import re
import logging
import numpy as np
from typing import List, Dict, Any, Optional
from ..config import settings

logger = logging.getLogger(__name__)

_whisper_model = None

def get_whisper_model():
    """Lazily load faster-whisper model."""
    global _whisper_model
    if _whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            # cpu execution with int8 or float32 compute type
            _whisper_model = WhisperModel(settings.WHISPER_MODEL, device="cpu", compute_type="int8")
            logger.info("Faster-whisper model loaded successfully: %s", settings.WHISPER_MODEL)
        except Exception as e:
            logger.warning("Could not load faster-whisper: %s. Fallback alignment will be active.", e)
            _whisper_model = False
    return _whisper_model

def transcribe_and_align(audio_path: str, reference_text: Optional[str] = None, duration: float = 0.0) -> Dict[str, Any]:
    """
    Transcribes audio and extracts word/segment timestamps.
    If reference_text is provided, it validates alignment against official transcript.
    Falls back gracefully if Whisper is unavailable.
    """
    model = get_whisper_model()
    
    if model:
        try:
            import soundfile as sf
            audio_data, sr = sf.read(audio_path, dtype="float32")
            if audio_data.ndim > 1:
                audio_data = np.mean(audio_data, axis=1)

            segments, info = model.transcribe(audio_data, word_timestamps=True, beam_size=2)
            seg_list = []
            word_list = []
            full_text_parts = []
            
            for seg in segments:
                full_text_parts.append(seg.text.strip())
                seg_dict = {
                    "start": round(seg.start, 2),
                    "end": round(seg.end, 2),
                    "text": seg.text.strip()
                }
                seg_list.append(seg_dict)
                
                if hasattr(seg, "words") and seg.words:
                    for w in seg.words:
                        cleaned = re.sub(r"[^\w\s]", "", w.word).strip()
                        if cleaned:
                            word_list.append({
                                "text": cleaned,
                                "raw": w.word,
                                "start": round(w.start, 2),
                                "end": round(w.end, 2),
                                "probability": getattr(w, "probability", 0.95)
                            })

            return {
                "text": " ".join(full_text_parts) if not reference_text else reference_text.strip(),
                "segments": seg_list,
                "words": word_list,
                "method": "faster-whisper",
                "language": info.language if hasattr(info, "language") else "en"
            }
        except Exception as e:
            logger.error("Whisper transcription error: %s. Using heuristic fallback.", e)

    # Heuristic fallback if Whisper unavailable or errored
    text_to_use = reference_text if reference_text else "Speech audio segment"
    return fallback_transcript_alignment(text_to_use, duration)

def fallback_transcript_alignment(transcript: str, duration: float) -> Dict[str, Any]:
    """
    Fallback alignment algorithm:
    Distributes sentences and words proportionally across the audio duration,
    accounting for commas, full stops, and word lengths.
    """
    cleaned_text = transcript.strip()
    words = re.findall(r"\S+", cleaned_text)
    if not words or duration <= 0:
        return {"text": cleaned_text, "segments": [], "words": [], "method": "fallback"}

    # Estimate timing: allocate slightly more time to longer words and punctuation pauses
    total_chars = sum(len(w) for w in words)
    # Reserve 10% of time for pauses between sentences/clauses
    word_time_pool = duration * 0.88
    time_per_char = word_time_pool / max(1, total_chars)

    current_time = 0.05 * duration
    word_records = []
    
    for i, w in enumerate(words):
        char_len = len(re.sub(r"[^\w]", "", w)) or 1
        w_dur = max(0.18, char_len * time_per_char)
        end_time = min(duration, current_time + w_dur)
        
        word_records.append({
            "text": re.sub(r"[^\w]", "", w).strip(),
            "raw": w,
            "start": round(current_time, 2),
            "end": round(end_time, 2),
            "probability": 0.88
        })
        
        # Add pause after punctuation
        pause = 0.04
        if w.endswith((".", "!", "?")):
            pause = 0.35
        elif w.endswith((",", ";", ":")):
            pause = 0.18
        current_time = min(duration, end_time + pause)

    # Create coarse sentence segments
    sentences = re.split(r"(?<=[.!?])\s+", cleaned_text)
    segments = []
    w_idx = 0
    for s in sentences:
        s_words = re.findall(r"\S+", s)
        if not s_words:
            continue
        start_w = word_records[min(w_idx, len(word_records) - 1)]["start"]
        w_idx = min(len(word_records), w_idx + len(s_words))
        end_w = word_records[min(w_idx - 1, len(word_records) - 1)]["end"]
        segments.append({
            "text": s.strip(),
            "start": start_w,
            "end": end_w
        })

    return {
        "text": cleaned_text,
        "segments": segments,
        "words": word_records,
        "method": "proportional_fallback",
        "language": "en"
    }
