import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

def compare_sentence_expected_vs_actual(
    expected_profile: Dict[str, Any],
    actual_prosody: Dict[str, Any],
    is_question: bool = False
) -> Dict[str, Any]:
    """
    Measures multidimensional acoustic mismatch between the semantic expected profile
    and the participant's actual delivery.
    Produces scalar deviation metrics and a Semantic Delivery Compatibility Score (0-100).
    """
    # 1. Pace Deviation
    exp_pace = expected_profile["pace_wpm"]
    act_pace = actual_prosody["speech_rate_wpm"]
    if act_pace < exp_pace["min"]:
        pace_dev = (exp_pace["min"] - act_pace) / 45.0
        pace_dir = "TOO_SLOW"
    elif act_pace > exp_pace["max"]:
        pace_dev = (act_pace - exp_pace["max"]) / 45.0
        pace_dir = "TOO_FAST"
    else:
        pace_dev = 0.0
        pace_dir = "ALIGNED"
    pace_dev = min(1.0, max(0.0, pace_dev))

    # 2. Pitch Variation Deviation
    exp_pitch = expected_profile["pitch_variation"]
    act_pitch = actual_prosody["pitch_variation"]
    if act_pitch < exp_pitch["min"]:
        pitch_dev = (exp_pitch["min"] - act_pitch) / 0.40
        pitch_dir = "TOO_FLAT"
    elif act_pitch > exp_pitch["max"]:
        pitch_dev = (act_pitch - exp_pitch["max"]) / 0.40
        pitch_dir = "TOO_ERRATIC"
    else:
        pitch_dev = 0.0
        pitch_dir = "ALIGNED"
    pitch_dev = min(1.0, max(0.0, pitch_dev))

    # 3. Energy Deviation
    exp_energy = expected_profile["energy"]
    act_energy = actual_prosody["normalized_energy"]
    if act_energy < exp_energy["min"]:
        energy_dev = (exp_energy["min"] - act_energy) / 0.35
        energy_dir = "TOO_QUIET"
    elif act_energy > exp_energy["max"]:
        energy_dev = (act_energy - exp_energy["max"]) / 0.35
        energy_dir = "TOO_LOUD"
    else:
        energy_dev = 0.0
        energy_dir = "ALIGNED"
    energy_dev = min(1.0, max(0.0, energy_dev))

    # 4. Pause Deviations
    exp_pb = expected_profile["pause_before"]
    act_pb = actual_prosody["pause_before"]
    exp_pa = expected_profile["pause_after"]
    act_pa = actual_prosody["pause_after"]

    pause_dev = 0.0
    pause_dir = "ALIGNED"
    if act_pa > exp_pa["max"] + 0.60:
        pause_dev = min(1.0, (act_pa - exp_pa["max"]) / 1.5)
        pause_dir = "EXCESSIVE_PAUSE"
    elif act_pa < exp_pa["min"] and expected_profile["role"] in ("question", "conclusion", "call to action"):
        pause_dev = min(1.0, (exp_pa["min"] - act_pa) / 0.40)
        pause_dir = "MISSING_PAUSE"

    # 5. Emphasis Deviation
    exp_emp = expected_profile["emphasis_strength"]["min"]
    act_emp = actual_prosody["emphasis_strength"]
    if act_emp < exp_emp:
        emp_dev = min(1.0, (exp_emp - act_emp) / max(0.05, exp_emp))
        emp_dir = "WEAK_EMPHASIS"
    else:
        emp_dev = 0.0
        emp_dir = "ALIGNED"

    # 6. Question Intonation Contour Check
    intonation_dev = 0.0
    if is_question or expected_profile.get("intonation") == "RISING":
        # Question expects rising or non-falling pitch movement at the tail
        tail_delta = actual_prosody.get("final_pitch_delta_hz", 0.0)
        if tail_delta < -8.0:
            intonation_dev = min(1.0, abs(tail_delta) / 30.0)

    # 7. Composite Weighted Semantic Compatibility Distance
    w_pace = 0.20
    w_pitch = 0.20
    w_energy = 0.20
    w_pause = 0.15
    w_emp = 0.15
    w_into = 0.10

    weighted_distance = (
        w_pace * pace_dev +
        w_pitch * pitch_dev +
        w_energy * energy_dev +
        w_pause * pause_dev +
        w_emp * emp_dev +
        w_into * intonation_dev
    )

    compatibility_score = round(max(0.0, min(100.0, 100.0 * (1.0 - weighted_distance))), 1)

    return {
        "compatibility_score": compatibility_score,
        "deviations": {
            "pace": round(pace_dev, 3),
            "pitch": round(pitch_dev, 3),
            "energy": round(energy_dev, 3),
            "pause": round(pause_dev, 3),
            "emphasis": round(emp_dev, 3),
            "intonation": round(intonation_dev, 3),
            "composite": round(weighted_distance, 3)
        },
        "directions": {
            "pace": pace_dir,
            "pitch": pitch_dir,
            "energy": energy_dir,
            "pause": pause_dir,
            "emphasis": emp_dir
        }
    }
