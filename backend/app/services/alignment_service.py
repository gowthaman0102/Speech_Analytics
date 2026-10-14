import re
import difflib
from typing import List, Dict, Any, Tuple

def normalize_token(t: str) -> str:
    return re.sub(r"[^\w]", "", t).lower()

def align_transcripts(
    ref_words: List[Dict[str, Any]], 
    part_words: List[Dict[str, Any]],
    ref_duration: float,
    part_duration: float
) -> Dict[str, Any]:
    """
    Aligns reference words with participant words using sequence matching.
    Produces aligned word pairs, sentence pairs, and alignment coverage.
    """
    ref_tokens = [normalize_token(w["text"]) for w in ref_words]
    part_tokens = [normalize_token(w["text"]) for w in part_words]

    matcher = difflib.SequenceMatcher(None, ref_tokens, part_tokens)
    matched_blocks = matcher.get_matching_blocks()

    aligned_pairs = []
    total_matched_words = 0

    for block in matched_blocks:
        if block.size == 0:
            continue
        total_matched_words += block.size
        for i in range(block.size):
            r_idx = block.a + i
            p_idx = block.b + i
            aligned_pairs.append({
                "word": ref_words[r_idx]["text"],
                "ref_start": ref_words[r_idx]["start"],
                "ref_end": ref_words[r_idx]["end"],
                "part_start": part_words[p_idx]["start"],
                "part_end": part_words[p_idx]["end"],
                "ref_word_idx": r_idx,
                "part_word_idx": p_idx
            })

    total_ref_words = max(1, len(ref_words))
    coverage = total_matched_words / total_ref_words

    # Anchor points for temporal warping (start, matches..., end)
    anchors = [(0.0, 0.0)]
    for pair in aligned_pairs:
        anchors.append(((pair["ref_start"] + pair["ref_end"]) / 2.0, (pair["part_start"] + pair["part_end"]) / 2.0))
    anchors.append((ref_duration, part_duration))
    # Sort and remove duplicates
    anchors = sorted(list(set(anchors)), key=lambda x: x[0])

    return {
        "aligned_pairs": aligned_pairs,
        "matched_words_count": total_matched_words,
        "total_ref_words": total_ref_words,
        "coverage": min(1.0, coverage),
        "anchors": anchors
    }
