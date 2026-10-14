import re
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

def segment_transcript_sentences(
    transcript: str,
    words: List[Dict[str, Any]],
    total_duration: float = 0.0
) -> List[Dict[str, Any]]:
    """
    Segments the transcript into distinct sentences/clauses with sub-second timestamps,
    mapping Whisper word timestamps to their respective sentences.
    Calculates pause before, pause after, speaking rate (WPM), and sentence boundaries.
    """
    if not words:
        # Fallback if no word-level timestamps exist
        raw_sentences = [s.strip() for s in re.split(r"(?<=[.?!;])\s+", transcript) if s.strip()]
        if not raw_sentences:
            raw_sentences = [transcript.strip()] if transcript.strip() else ["Speech recording"]

        est_dur = total_duration / max(1, len(raw_sentences))
        results = []
        for i, s in enumerate(raw_sentences):
            start = round(i * est_dur, 2)
            end = round((i + 1) * est_dur, 2)
            w_count = len(s.split())
            dur = max(0.1, end - start)
            wpm = round((w_count / dur) * 60, 1)
            results.append({
                "id": i + 1,
                "text": s,
                "start": start,
                "end": end,
                "duration": round(dur, 2),
                "words": [],
                "word_count": w_count,
                "pause_before": 0.0 if i == 0 else 0.3,
                "pause_after": 0.3 if i < len(raw_sentences) - 1 else 0.0,
                "speech_rate_wpm": wpm,
                "is_question": bool(s.strip().endswith("?")),
                "is_exclamation": bool(s.strip().endswith("!"))
            })
        return results

    # Group words into sentences based on punctuation or significant pause gaps (>0.65s)
    sentences_data = []
    current_sentence_words = []
    current_sentence_text = []

    for i, w in enumerate(words):
        raw_word = w.get("raw", w.get("text", ""))
        current_sentence_words.append(w)
        current_sentence_text.append(raw_word)

        # Check for sentence end punctuation: ., ?, !, ;
        ends_with_terminal = bool(re.search(r"[.?!;]$", raw_word.strip()))

        # Check for large inter-word silence pause (>0.75s) indicating a natural sentence break
        large_pause = False
        if i < len(words) - 1:
            next_start = words[i + 1].get("start", w.get("end", 0))
            if next_start - w.get("end", 0) >= 0.75:
                large_pause = True

        if ends_with_terminal or large_pause or (i == len(words) - 1):
            if current_sentence_words:
                s_text = " ".join(current_sentence_text).strip()
                s_start = current_sentence_words[0].get("start", 0.0)
                s_end = current_sentence_words[-1].get("end", s_start + 0.5)
                s_dur = max(0.1, s_end - s_start)
                w_count = len(current_sentence_words)
                wpm = round((w_count / s_dur) * 60, 1)

                sentences_data.append({
                    "id": len(sentences_data) + 1,
                    "text": s_text,
                    "start": round(s_start, 2),
                    "end": round(s_end, 2),
                    "duration": round(s_dur, 2),
                    "words": current_sentence_words,
                    "word_count": w_count,
                    "speech_rate_wpm": wpm,
                    "is_question": bool(s_text.endswith("?")),
                    "is_exclamation": bool(s_text.endswith("!"))
                })
                current_sentence_words = []
                current_sentence_text = []

    # Calculate pause_before and pause_after between adjacent sentences
    for idx, s in enumerate(sentences_data):
        if idx == 0:
            s["pause_before"] = round(s["start"], 2)
        else:
            prev_end = sentences_data[idx - 1]["end"]
            gap = max(0.0, s["start"] - prev_end)
            s["pause_before"] = round(gap, 2)

        if idx < len(sentences_data) - 1:
            next_start = sentences_data[idx + 1]["start"]
            gap = max(0.0, next_start - s["end"])
            s["pause_after"] = round(gap, 2)
        else:
            s["pause_after"] = round(max(0.0, total_duration - s["end"]), 2) if total_duration > 0 else 0.0

    logger.info("Transcript successfully segmented into %d timestamped sentences.", len(sentences_data))
    return sentences_data
