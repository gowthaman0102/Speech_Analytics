import logging
import numpy as np
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

DEFAULT_RUBRIC_WEIGHTS = {
    "Pacing & Fluency": 0.20,
    "Pitch & Modulation": 0.20,
    "Semantic Tone Alignment": 0.20,
    "Emphasis & Key Word Prominence": 0.15,
    "Pause & Rhetorical Rhythm": 0.10,
    "Vocal Energy & Expression": 0.15
}

def calculate_semantic_evaluation_scores(
    sentences: List[Dict[str, Any]],
    expected_profiles: List[Dict[str, Any]],
    actual_prosodies: List[Dict[str, Any]],
    comparisons: List[Dict[str, Any]],
    flaws: List[Dict[str, Any]],
    asr_confidence: float = 0.95,
    custom_weights: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Computes deterministic rubric scores across 6 distinct communicative dimensions
    derived directly from measurable acoustic and semantic deviations.
    """
    weights = custom_weights or DEFAULT_RUBRIC_WEIGHTS

    if not comparisons:
        return {
            "overallScore": 75.0,
            "similarity": 75.0,
            "confidence": 85.0,
            "detectedSpeakingStyle": "General Speech",
            "rubric": {k: 75.0 for k in weights},
            "rubricDetails": [
                {"category": k, "score": 75.0, "weight": w, "description": "Standard delivery"}
                for k, w in weights.items()
            ]
        }

    # 1. Component calculations
    pace_devs = [c["deviations"]["pace"] for c in comparisons]
    pitch_devs = [c["deviations"]["pitch"] for c in comparisons]
    energy_devs = [c["deviations"]["energy"] for c in comparisons]
    pause_devs = [c["deviations"]["pause"] for c in comparisons]
    emp_devs = [c["deviations"]["emphasis"] for c in comparisons]
    compat_scores = [c["compatibility_score"] for c in comparisons]

    # Scores out of 100
    pacing_score = round(max(35.0, min(100.0, 100.0 * (1.0 - np.mean(pace_devs)))), 1)
    pitch_score = round(max(35.0, min(100.0, 100.0 * (1.0 - np.mean(pitch_devs)))), 1)
    tone_score = round(max(35.0, min(100.0, float(np.mean(compat_scores)))), 1)
    emphasis_score = round(max(35.0, min(100.0, 100.0 * (1.0 - np.mean(emp_devs)))), 1)
    pause_score = round(max(35.0, min(100.0, 100.0 * (1.0 - np.mean(pause_devs)))), 1)
    energy_score = round(max(35.0, min(100.0, 100.0 * (1.0 - np.mean(energy_devs)))), 1)

    # Flaw severity penalty deduction
    severe_flaws = sum(1 for f in flaws if f.get("severity") == "HIGH")
    medium_flaws = sum(1 for f in flaws if f.get("severity") == "MEDIUM")
    flaw_penalty = (severe_flaws * 2.5) + (medium_flaws * 1.0)

    pacing_score = round(max(30.0, pacing_score - (flaw_penalty * 0.2)), 1)
    pitch_score = round(max(30.0, pitch_score - (flaw_penalty * 0.2)), 1)
    tone_score = round(max(30.0, tone_score - (flaw_penalty * 0.3)), 1)

    dimension_scores = {
        "Pacing & Fluency": pacing_score,
        "Pitch & Modulation": pitch_score,
        "Semantic Tone Alignment": tone_score,
        "Emphasis & Key Word Prominence": emphasis_score,
        "Pause & Rhetorical Rhythm": pause_score,
        "Vocal Energy & Expression": energy_score
    }

    # 2. Overall Weighted Score
    overall_score = 0.0
    for dim, score in dimension_scores.items():
        w = weights.get(dim, 0.15)
        overall_score += score * w
    overall_score = round(max(0.0, min(100.0, overall_score)), 1)

    # 3. Detected Speaking Style
    intent_counts: Dict[str, int] = {}
    for p in expected_profiles:
        pi = p.get("primary_intent", "neutral_statement")
        intent_counts[pi] = intent_counts.get(pi, 0) + 1

    sorted_intents = sorted(intent_counts.items(), key=lambda x: x[1], reverse=True)
    top_intent = sorted_intents[0][0] if sorted_intents else "neutral_statement"

    style_map = {
        "persuasive": "Persuasive Oratory",
        "urgent": "Urgent / Call to Action",
        "call_to_action": "Call to Action / Advocacy",
        "motivational": "Motivational / Inspiring",
        "serious": "Solemn / Critical Argument",
        "emotional": "Interpretive / Emotional",
        "reflective": "Reflective / Contemplative",
        "question": "Inquiring / Dialectical",
        "informative": "Informative / Educational",
        "neutral_statement": "Expository / Factual"
    }
    detected_speaking_style = style_map.get(top_intent, "Public Speaking")

    # 4. Confidence Score
    # Merges ASR token confidence, speech duration sufficiency, and prosody consistency
    dur_factor = min(1.0, len(sentences) / 4.0)
    composite_confidence = round(min(98.0, max(50.0, (asr_confidence * 60.0) + (dur_factor * 35.0))), 1)

    # 5. Rubric Details for UI
    rubric_descriptions = {
        "Pacing & Fluency": "Speech velocity control and rhythmic stability compared to recommended 125–155 WPM.",
        "Pitch & Modulation": "Fundamental frequency intonation and tonal variety preventing monotone delivery.",
        "Semantic Tone Alignment": "Degree to which vocal delivery matches the sentence's communicative intention.",
        "Emphasis & Key Word Prominence": "Vocal dynamic punch and acoustic prominence on pivotal rhetorical keywords.",
        "Pause & Rhetorical Rhythm": "Natural punctuation pauses, thought transitions, and avoidance of hesitation gaps.",
        "Vocal Energy & Expression": "Dynamic vocal energy, projection, and expressive support throughout clauses."
    }

    rubric_details = []
    for dim, score in dimension_scores.items():
        rubric_details.append({
            "category": dim,
            "score": score,
            "weight": weights.get(dim, 0.15),
            "description": rubric_descriptions.get(dim, "Acoustic signal measurement")
        })

    return {
        "overallScore": overall_score,
        "similarity": tone_score,  # Semantic tone compatibility
        "confidence": composite_confidence,
        "detectedSpeakingStyle": detected_speaking_style,
        "rubric": dimension_scores,
        "rubricDetails": rubric_details
    }


import numpy as np
from typing import Dict, Any, List

def calculate_rubric_scores(
    time_analysis: Dict[str, Any],
    ref_features: Dict[str, Any],
    part_features: Dict[str, Any],
    flaws: List[Dict[str, Any]],
    alignment_info: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Calculates deterministic, reproducible rubric scores out of 100 across 6 dimensions:
    - Pace & Fluency (0.20)
    - Pitch & Modulation (0.20)
    - Pause & Rhythm (0.15)
    - Vocal Energy (0.15)
    - Clarity/Stability (0.15)
    - Overall Delivery (0.15)
    
    Produces deterministic Overall Score, Reference Similarity, and Confidence metrics.
    """
    devs = time_analysis["deviations"]
    
    def get_flaw_weight(severity: str) -> float:
        if severity == "HIGH":
            return 1.0
        elif severity == "MEDIUM":
            return 0.6
        return 0.25

    # 1. Pace & Fluency Error
    mean_rate_dev = float(np.mean(devs["rate"])) if devs["rate"] else 0.2
    flaw_penalty_pace = sum(0.08 * get_flaw_weight(f.get("severity", "MEDIUM")) for f in flaws if f["type"] in ["RUSHED_DELIVERY", "SLOW_DELIVERY", "POOR_FLUENCY"])
    pace_error = min(1.0, mean_rate_dev + flaw_penalty_pace)
    pace_score = round(float(np.clip(100.0 * (1.0 - pace_error), 20.0, 100.0)), 1)

    # 2. Pitch & Modulation Error
    mean_pitch_dev = float(np.mean(devs["pitch"])) if devs["pitch"] else 0.2
    flaw_penalty_pitch = sum(0.10 * get_flaw_weight(f.get("severity", "MEDIUM")) for f in flaws if f["type"] in ["MONOTONE", "EXCESSIVE_PITCH_VARIATION"])
    pitch_error = min(1.0, mean_pitch_dev + flaw_penalty_pitch)
    pitch_score = round(float(np.clip(100.0 * (1.0 - pitch_error), 20.0, 100.0)), 1)

    # 3. Pause & Rhythm Error
    mean_pause_dev = float(np.mean(devs["pause"])) if devs["pause"] else 0.15
    flaw_penalty_pause = sum(0.10 * get_flaw_weight(f.get("severity", "MEDIUM")) for f in flaws if f["type"] in ["MISSING_PAUSE", "EXCESSIVE_PAUSE"])
    pause_error = min(1.0, mean_pause_dev + flaw_penalty_pause)
    pause_score = round(float(np.clip(100.0 * (1.0 - pause_error), 20.0, 100.0)), 1)

    # 4. Vocal Energy Error
    mean_energy_dev = float(np.mean(devs["energy"])) if devs["energy"] else 0.15
    flaw_penalty_energy = sum(0.08 * get_flaw_weight(f.get("severity", "MEDIUM")) for f in flaws if f["type"] in ["LOW_VOLUME", "EXCESSIVE_VOLUME", "INCONSISTENT_ENERGY"])
    energy_error = min(1.0, mean_energy_dev + flaw_penalty_energy)
    energy_score = round(float(np.clip(100.0 * (1.0 - energy_error), 20.0, 100.0)), 1)

    # 5. Clarity & Stability Error
    raw_mfcc_dev = float(np.mean(devs["mfcc"])) if devs["mfcc"] else 0.15
    mean_mfcc_dev = max(0.0, (raw_mfcc_dev - 0.12) / 0.88)
    flaw_penalty_clarity = sum(0.06 * get_flaw_weight(f.get("severity", "MEDIUM")) for f in flaws if f["type"] in ["WEAK_EMPHASIS", "ACOUSTIC_DEVIATION"])
    clarity_error = min(1.0, mean_mfcc_dev + flaw_penalty_clarity)
    clarity_score = round(float(np.clip(100.0 * (1.0 - clarity_error), 20.0, 100.0)), 1)

    # 6. Overall Delivery Score (composite of the dimensions + weighted penalty)
    combined_mean_dev = float(np.mean(devs["combined"])) if devs["combined"] else 0.2
    delivery_score = round(float(np.clip(100.0 * (1.0 - combined_mean_dev), 20.0, 100.0)), 1)

    # Clean delivery guarantee: performances with zero MEDIUM/HIGH severity flaws reflect competitive mastery
    has_significant_flaws = any(f.get("severity") in ["MEDIUM", "HIGH"] for f in flaws)
    if not has_significant_flaws:
        pace_score = round(max(pace_score, 88.0), 1)
        pitch_score = round(max(pitch_score, 88.0), 1)
        pause_score = round(max(pause_score, 88.0), 1)
        energy_score = round(max(energy_score, 88.0), 1)
        delivery_score = round(max(delivery_score, 88.0), 1)

    # Deterministic Rubric Combination
    weights = {
        "pace": 0.20,
        "pitch": 0.20,
        "pause": 0.15,
        "energy": 0.15,
        "clarity": 0.15,
        "delivery": 0.15
    }

    overall_score = round(
        pace_score * weights["pace"] +
        pitch_score * weights["pitch"] +
        pause_score * weights["pause"] +
        energy_score * weights["energy"] +
        clarity_score * weights["clarity"] +
        delivery_score * weights["delivery"],
        1
    )

    similarity = round(float(np.clip(100.0 * (1.0 - combined_mean_dev), 10.0, 100.0)), 1)

    # Deterministic confidence based on:
    # 1. Transcript alignment coverage (40%)
    # 2. Voiced pitch frame ratio (30%)
    # 3. Audio SNR/RMS stability (30%)
    coverage = float(alignment_info.get("coverage", 0.85))
    part_voiced_ratio = float(np.mean(part_features.get("voiced_flag", [True])))
    snr_factor = 0.95 if part_features.get("rms_mean", 0.1) > 0.02 else 0.75

    raw_conf = (0.40 * coverage) + (0.30 * min(1.0, part_voiced_ratio * 1.5)) + (0.30 * snr_factor)
    confidence = round(float(np.clip(raw_conf * 100.0, 50.0, 98.0)), 1)

    # Determine Strongest and Weakest Areas
    dimension_scores = {
        "Pace & Fluency": pace_score,
        "Pitch & Modulation": pitch_score,
        "Pause & Rhythm": pause_score,
        "Vocal Energy": energy_score,
        "Clarity & Stability": clarity_score
    }
    sorted_dims = sorted(dimension_scores.items(), key=lambda x: x[1])
    weakest_area = sorted_dims[0][0]
    strongest_area = sorted_dims[-1][0]

    rubric_dict = {
        "pace": pace_score,
        "pitch": pitch_score,
        "pause": pause_score,
        "energy": energy_score,
        "clarity": clarity_score,
        "delivery": delivery_score
    }

    rubric_details = [
        {"category": "Pace & Fluency", "score": pace_score, "weight": weights["pace"], "description": "Syllable rate, fluency, temporal cadence."},
        {"category": "Pitch & Modulation", "score": pitch_score, "weight": weights["pitch"], "description": "Tonal variation, F0 dynamic contour, intonation."},
        {"category": "Pause & Rhythm", "score": pause_score, "weight": weights["pause"], "description": "Rhetorical silences, breath pauses, sentence transitions."},
        {"category": "Vocal Energy", "score": energy_score, "weight": weights["energy"], "description": "Loudness dynamic range, stress contrast, RMS consistency."},
        {"category": "Clarity & Stability", "score": clarity_score, "weight": weights["clarity"], "description": "Spectral consistency, timbral articulation, acoustic stability."},
        {"category": "Overall Delivery", "score": delivery_score, "weight": weights["delivery"], "description": "Synthesis of rhetorical execution relative to baseline."}
    ]

    return {
        "overall_score": overall_score,
        "similarity": similarity,
        "confidence": confidence,
        "strongest_area": strongest_area,
        "weakest_area": weakest_area,
        "rubric": rubric_dict,
        "rubric_details": rubric_details
    }
