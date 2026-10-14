import re
import logging
import numpy as np
from typing import List, Dict, Any, Tuple
from .semantic_analysis_service import compute_sentence_embeddings

logger = logging.getLogger(__name__)

INTENT_DESCRIPTIONS = {
    "urgent": "This is an urgent call requiring immediate, critical, and decisive action before time runs out.",
    "call_to_action": "This is an explicit call to action urging the listeners to act, choose, and commit today.",
    "persuasive": "This is a persuasive, convincing, and logically reasoned argument designed to influence minds.",
    "motivational": "This is an inspiring, motivational, and uplifting statement designed to give courage and hope.",
    "question": "This is an inquiring, provocative, rhetorical, or direct question challenging the audience.",
    "serious": "This is a grave, solemn, serious, and defining challenge of great consequence.",
    "emotional": "This is a deeply emotional, heartfelt, passionate, and moving personal appeal.",
    "reflective": "This is a thoughtful, contemplative, and reflective observation on history, values, and memory.",
    "conclusion": "This is a concluding summary, final rhetorical emphasis, and lasting resolution.",
    "transition": "This is a transition sentence bridging from one topic, point, or argument to the next.",
    "informative": "This is an informative, educational, objective, and descriptive factual statement.",
    "neutral_statement": "This is a calm, neutral, balanced, and matter-of-fact declarative statement.",
    "important_point": "This is an essential, paramount, and critical message that must not be overlooked.",
    "contrast": "This is a contrasting point highlighting the difference between two opposing choices or ideas."
}

_anchor_embeddings = None
_anchor_labels = list(INTENT_DESCRIPTIONS.keys())

def get_anchor_embeddings() -> np.ndarray:
    """Precomputes and caches dense semantic embeddings for communicative intent anchors."""
    global _anchor_embeddings
    if _anchor_embeddings is None:
        logger.info("Computing semantic anchor embeddings for %d communicative intents...", len(_anchor_labels))
        anchor_texts = [INTENT_DESCRIPTIONS[label] for label in _anchor_labels]
        _anchor_embeddings = compute_sentence_embeddings(anchor_texts)
    return _anchor_embeddings

def classify_sentence_intents(
    sentence_text: str,
    top_k: int = 3
) -> List[Dict[str, Any]]:
    """
    Classifies sentence into communicative intents using semantic vector similarity
    augmented with rhetorical syntax cues.
    """
    cleaned = sentence_text.strip()
    if not cleaned:
        return [{"label": "neutral_statement", "score": 1.0}]

    anchors = get_anchor_embeddings()
    sentence_vec = compute_sentence_embeddings([cleaned])[0]

    # Cosine similarities
    sims = np.dot(anchors, sentence_vec)

    # Convert to probability-like distribution via scaled softmax (temperature = 0.25)
    exp_sims = np.exp((sims - np.max(sims)) / 0.25)
    probs = exp_sims / np.sum(exp_sims)

    # Syntactic / Lexical boosting
    text_lower = cleaned.lower()
    boosts = {label: 0.0 for label in _anchor_labels}

    if text_lower.endswith("?") or re.match(r"^(why|how|what|who|when|where|can we|should we|will we|is it)\b", text_lower):
        boosts["question"] += 0.40

    if text_lower.endswith("!") or re.search(r"\b(let us|we must|act now|choose today|take a stand)\b", text_lower):
        boosts["call_to_action"] += 0.35
        boosts["urgent"] += 0.30

    if re.search(r"\b(crucial|critical|paramount|defining|never|cannot afford|vital)\b", text_lower):
        boosts["urgent"] += 0.25
        boosts["serious"] += 0.25
        boosts["important_point"] += 0.25

    if re.match(r"^(furthermore|moreover|however|in contrast|turning to|on the other hand|secondly|finally)\b", text_lower):
        boosts["transition"] += 0.35

    if re.search(r"\b(in conclusion|let us remember|finally|to conclude|let us choose responsibility today)\b", text_lower):
        boosts["conclusion"] += 0.35

    # Combine similarity with boosts
    combined = []
    for idx, label in enumerate(_anchor_labels):
        raw_score = float(probs[idx]) + boosts[label]
        combined.append((label, raw_score))

    # Normalize top scores to 0-1
    total = sum(s for _, s in combined)
    scored_labels = [{"label": label, "score": round(score / total, 3)} for label, score in combined]
    scored_labels.sort(key=lambda x: x["score"], reverse=True)

    return scored_labels[:top_k]

def detect_sentence_role(
    sentence_idx: int,
    total_sentences: int,
    sentence_text: str,
    top_intents: List[Dict[str, Any]]
) -> str:
    """
    Infers the structural and oratorical role of a sentence in the context of the speech.
    """
    text_lower = sentence_text.lower().strip()
    top_label = top_intents[0]["label"] if top_intents else "neutral_statement"

    # Positional heuristics
    is_opening = sentence_idx == 0 or (sentence_idx < 2 and total_sentences >= 5)
    is_ending = sentence_idx >= total_sentences - 2 and total_sentences >= 4

    if text_lower.endswith("?") or top_label == "question":
        return "question"

    if is_opening and ("good morning" in text_lower or "welcome" in text_lower or "today" in text_lower or "members of" in text_lower):
        return "opening"

    if is_ending or "conclusion" in top_label or "let us choose" in text_lower or "finally" in text_lower:
        return "conclusion"

    if top_label in ("call_to_action", "urgent"):
        return "call to action"

    if top_label in ("transition", "contrast"):
        return "transition"

    if top_label in ("emotional", "reflective"):
        return "emotional appeal"

    if top_label in ("persuasive", "important_point", "serious"):
        return "argument"

    return "body"
