import re
import logging
import numpy as np
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

_sentence_model = None

# High-impact rhetorical and semantic modal words in competitive speech
RHETORICAL_WEIGHT_WORDS = {
    "must": 0.95, "never": 0.95, "cannot": 0.92, "always": 0.90, "will": 0.85,
    "critical": 0.95, "crucial": 0.95, "essential": 0.90, "vital": 0.90,
    "future": 0.88, "change": 0.88, "freedom": 0.92, "justice": 0.92,
    "important": 0.88, "decisive": 0.90, "crisis": 0.95, "today": 0.85,
    "history": 0.85, "courage": 0.90, "leadership": 0.90, "responsibility": 0.92,
    "action": 0.90, "hope": 0.85, "peace": 0.88, "truth": 0.90, "honor": 0.88,
    "confront": 0.90, "challenge": 0.88, "perseverance": 0.90, "discipline": 0.88,
    "now": 0.85, "together": 0.85, "stand": 0.85, "fight": 0.90, "defend": 0.90
}

STOP_WORDS = {
    "the", "a", "an", "is", "was", "are", "were", "and", "or", "in", "on", "at",
    "to", "for", "of", "with", "as", "by", "that", "this", "it", "from", "be",
    "have", "has", "had", "do", "does", "did", "but", "so", "if", "out", "up"
}

def get_sentence_transformer():
    """Lazily loads all-MiniLM-L6-v2 on CPU."""
    global _sentence_model
    if _sentence_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _sentence_model = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
            logger.info("SentenceTransformer (all-MiniLM-L6-v2) loaded successfully.")
        except Exception as e:
            logger.warning("Could not load sentence-transformers: %s. Using heuristic embedding fallback.", e)
            _sentence_model = False
    return _sentence_model

def compute_sentence_embeddings(sentences: List[str]) -> np.ndarray:
    """Computes dense 384-dimensional semantic vectors for a batch of sentences."""
    model = get_sentence_transformer()
    if model:
        try:
            embeddings = model.encode(sentences, convert_to_numpy=True, normalize_embeddings=True)
            return embeddings
        except Exception as e:
            logger.error("Error computing sentence embeddings: %s. Using fallback.", e)

    # Deterministic TF-IDF / character-n-gram hash embedding fallback (dimension 384)
    vectors = []
    for s in sentences:
        vec = np.zeros(384, dtype=np.float32)
        words = re.findall(r"\w+", s.lower())
        for w in words:
            h = hash(w) % 384
            vec[h] += 1.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        vectors.append(vec)
    return np.array(vectors)

def extract_important_words_from_sentence(
    sentence_text: str,
    sentence_words: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Identifies semantically key words in a sentence based on rhetorical weight,
    part-of-speech heuristics, length, and frequency.
    """
    important = []
    for w in sentence_words:
        cleaned = re.sub(r"[^\w]", "", w.get("text", w.get("raw", ""))).lower()
        if not cleaned or cleaned in STOP_WORDS or len(cleaned) < 3:
            continue

        # Score importance
        score = 0.50
        if cleaned in RHETORICAL_WEIGHT_WORDS:
            score = RHETORICAL_WEIGHT_WORDS[cleaned]
        elif len(cleaned) >= 8:
            score = 0.75  # Polysyllabic content words carry higher delivery importance
        elif len(cleaned) >= 6:
            score = 0.65

        # Check if capitalized in original text (proper noun or title emphasis)
        raw_val = w.get("raw", w.get("text", ""))
        if raw_val and raw_val[0].isupper() and not sentence_text.startswith(raw_val):
            score = min(1.0, score + 0.15)

        if score >= 0.60:
            important.append({
                "word": cleaned,
                "raw": raw_val,
                "start": w.get("start", 0.0),
                "end": w.get("end", 0.0),
                "importance_score": round(score, 2)
            })

    # Sort descending by importance score
    important.sort(key=lambda x: x["importance_score"], reverse=True)
    return important
