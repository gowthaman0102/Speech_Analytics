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
    
    # 1. Pace & Fluency Error
    # Mean rate deviation + penalty for rushed/slow flaws
    mean_rate_dev = float(np.mean(devs["rate"])) if devs["rate"] else 0.2
    flaw_penalty_pace = sum(0.08 for f in flaws if f["type"] in ["RUSHED_DELIVERY", "SLOW_DELIVERY", "POOR_FLUENCY"])
    pace_error = min(1.0, mean_rate_dev + flaw_penalty_pace)
    pace_score = round(float(np.clip(100.0 * (1.0 - pace_error), 20.0, 100.0)), 1)

    # 2. Pitch & Modulation Error
    mean_pitch_dev = float(np.mean(devs["pitch"])) if devs["pitch"] else 0.2
    flaw_penalty_pitch = sum(0.10 for f in flaws if f["type"] in ["MONOTONE", "EXCESSIVE_PITCH_VARIATION"])
    pitch_error = min(1.0, mean_pitch_dev + flaw_penalty_pitch)
    pitch_score = round(float(np.clip(100.0 * (1.0 - pitch_error), 20.0, 100.0)), 1)

    # 3. Pause & Rhythm Error
    mean_pause_dev = float(np.mean(devs["pause"])) if devs["pause"] else 0.15
    flaw_penalty_pause = sum(0.10 for f in flaws if f["type"] in ["MISSING_PAUSE", "EXCESSIVE_PAUSE"])
    pause_error = min(1.0, mean_pause_dev + flaw_penalty_pause)
    pause_score = round(float(np.clip(100.0 * (1.0 - pause_error), 20.0, 100.0)), 1)

    # 4. Vocal Energy Error
    mean_energy_dev = float(np.mean(devs["energy"])) if devs["energy"] else 0.15
    flaw_penalty_energy = sum(0.08 for f in flaws if f["type"] in ["LOW_VOLUME", "EXCESSIVE_VOLUME", "INCONSISTENT_ENERGY"])
    energy_error = min(1.0, mean_energy_dev + flaw_penalty_energy)
    energy_score = round(float(np.clip(100.0 * (1.0 - energy_error), 20.0, 100.0)), 1)

    # 5. Clarity & Stability Error
    mean_mfcc_dev = float(np.mean(devs["mfcc"])) if devs["mfcc"] else 0.2
    flaw_penalty_clarity = sum(0.06 for f in flaws if f["type"] in ["WEAK_EMPHASIS", "ACOUSTIC_DEVIATION"])
    clarity_error = min(1.0, mean_mfcc_dev + flaw_penalty_clarity)
    clarity_score = round(float(np.clip(100.0 * (1.0 - clarity_error), 20.0, 100.0)), 1)

    # 6. Overall Delivery Score (composite of the dimensions + weighted penalty)
    combined_mean_dev = float(np.mean(devs["combined"])) if devs["combined"] else 0.2
    delivery_score = round(float(np.clip(100.0 * (1.0 - combined_mean_dev), 20.0, 100.0)), 1)

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
