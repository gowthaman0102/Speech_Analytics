import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

# Baseline recommended prosodic ranges by communicative intent
INTENT_PROSODIC_RANGES = {
    "urgent": {
        "pace_wpm": {"min": 135, "max": 165, "ideal": 150},
        "pitch_variation": {"min": 0.50, "max": 0.88, "ideal": 0.70},
        "energy": {"min": 0.58, "max": 0.90, "ideal": 0.75},
        "pause_before": {"min": 0.15, "max": 0.60, "ideal": 0.30},
        "pause_after": {"min": 0.20, "max": 0.70, "ideal": 0.40},
        "emphasis_strength": {"min": 0.22, "ideal": 0.32},
        "intonation": "MODULATED",
        "description": "Urgent call requiring elevated energy, crisp cadence, and distinct emphasis on imperative words."
    },
    "call_to_action": {
        "pace_wpm": {"min": 130, "max": 160, "ideal": 145},
        "pitch_variation": {"min": 0.52, "max": 0.88, "ideal": 0.72},
        "energy": {"min": 0.60, "max": 0.92, "ideal": 0.78},
        "pause_before": {"min": 0.20, "max": 0.65, "ideal": 0.35},
        "pause_after": {"min": 0.25, "max": 0.80, "ideal": 0.45},
        "emphasis_strength": {"min": 0.25, "ideal": 0.35},
        "intonation": "EMPHATIC",
        "description": "Call to action demanding commanding vocal projection, decisive pauses, and high focal emphasis."
    },
    "persuasive": {
        "pace_wpm": {"min": 125, "max": 155, "ideal": 140},
        "pitch_variation": {"min": 0.48, "max": 0.82, "ideal": 0.65},
        "energy": {"min": 0.52, "max": 0.82, "ideal": 0.68},
        "pause_before": {"min": 0.15, "max": 0.60, "ideal": 0.30},
        "pause_after": {"min": 0.20, "max": 0.70, "ideal": 0.35},
        "emphasis_strength": {"min": 0.18, "ideal": 0.28},
        "intonation": "MODULATED",
        "description": "Persuasive argument needing controlled pacing, steady energy, and tonal modulation to guide reasoning."
    },
    "motivational": {
        "pace_wpm": {"min": 125, "max": 160, "ideal": 142},
        "pitch_variation": {"min": 0.52, "max": 0.88, "ideal": 0.70},
        "energy": {"min": 0.55, "max": 0.88, "ideal": 0.72},
        "pause_before": {"min": 0.20, "max": 0.65, "ideal": 0.35},
        "pause_after": {"min": 0.25, "max": 0.80, "ideal": 0.45},
        "emphasis_strength": {"min": 0.20, "ideal": 0.30},
        "intonation": "UPLIFTING",
        "description": "Motivational delivery requiring inspiring tonal lift, resonant energy, and deliberate cadential pauses."
    },
    "question": {
        "pace_wpm": {"min": 120, "max": 155, "ideal": 138},
        "pitch_variation": {"min": 0.52, "max": 0.90, "ideal": 0.72},
        "energy": {"min": 0.45, "max": 0.78, "ideal": 0.62},
        "pause_before": {"min": 0.20, "max": 0.70, "ideal": 0.35},
        "pause_after": {"min": 0.35, "max": 1.10, "ideal": 0.65},
        "emphasis_strength": {"min": 0.15, "ideal": 0.25},
        "intonation": "RISING",
        "description": "Rhetorical or direct question expecting perceptible terminal pitch shift and audience reflection pause."
    },
    "serious": {
        "pace_wpm": {"min": 115, "max": 145, "ideal": 130},
        "pitch_variation": {"min": 0.42, "max": 0.75, "ideal": 0.58},
        "energy": {"min": 0.52, "max": 0.80, "ideal": 0.66},
        "pause_before": {"min": 0.25, "max": 0.80, "ideal": 0.45},
        "pause_after": {"min": 0.30, "max": 0.90, "ideal": 0.50},
        "emphasis_strength": {"min": 0.18, "ideal": 0.28},
        "intonation": "SOLEMN",
        "description": "Serious statement requiring solemn, grounded pace and deliberate gravitas without monotone collapse."
    },
    "emotional": {
        "pace_wpm": {"min": 110, "max": 145, "ideal": 128},
        "pitch_variation": {"min": 0.48, "max": 0.85, "ideal": 0.66},
        "energy": {"min": 0.40, "max": 0.75, "ideal": 0.58},
        "pause_before": {"min": 0.30, "max": 0.90, "ideal": 0.50},
        "pause_after": {"min": 0.35, "max": 1.10, "ideal": 0.60},
        "emphasis_strength": {"min": 0.16, "ideal": 0.26},
        "intonation": "EXPRESSIVE",
        "description": "Emotional passage calling for expressive pitch inflection, softened velocity, and breathing space."
    },
    "reflective": {
        "pace_wpm": {"min": 110, "max": 140, "ideal": 125},
        "pitch_variation": {"min": 0.40, "max": 0.72, "ideal": 0.55},
        "energy": {"min": 0.38, "max": 0.70, "ideal": 0.54},
        "pause_before": {"min": 0.30, "max": 0.90, "ideal": 0.50},
        "pause_after": {"min": 0.40, "max": 1.20, "ideal": 0.70},
        "emphasis_strength": {"min": 0.14, "ideal": 0.22},
        "intonation": "CONTEMPLATIVE",
        "description": "Reflective observation requiring contemplation time, gentle rhythm, and longer boundary pauses."
    },
    "conclusion": {
        "pace_wpm": {"min": 115, "max": 145, "ideal": 130},
        "pitch_variation": {"min": 0.45, "max": 0.80, "ideal": 0.62},
        "energy": {"min": 0.54, "max": 0.85, "ideal": 0.70},
        "pause_before": {"min": 0.30, "max": 0.85, "ideal": 0.45},
        "pause_after": {"min": 0.50, "max": 1.50, "ideal": 0.85},
        "emphasis_strength": {"min": 0.22, "ideal": 0.32},
        "intonation": "RESOLVED",
        "description": "Concluding synthesis needing decelerating cadence, finality emphasis, and resonant closing stillness."
    },
    "transition": {
        "pace_wpm": {"min": 130, "max": 155, "ideal": 142},
        "pitch_variation": {"min": 0.40, "max": 0.70, "ideal": 0.55},
        "energy": {"min": 0.45, "max": 0.72, "ideal": 0.60},
        "pause_before": {"min": 0.25, "max": 0.70, "ideal": 0.40},
        "pause_after": {"min": 0.25, "max": 0.70, "ideal": 0.40},
        "emphasis_strength": {"min": 0.12, "ideal": 0.20},
        "intonation": "BRIDGING",
        "description": "Transition segment bridging points with distinct boundary pauses and clean, intelligible cadence."
    },
    "neutral_statement": {
        "pace_wpm": {"min": 125, "max": 155, "ideal": 140},
        "pitch_variation": {"min": 0.35, "max": 0.68, "ideal": 0.50},
        "energy": {"min": 0.42, "max": 0.70, "ideal": 0.56},
        "pause_before": {"min": 0.15, "max": 0.55, "ideal": 0.25},
        "pause_after": {"min": 0.20, "max": 0.60, "ideal": 0.30},
        "emphasis_strength": {"min": 0.10, "ideal": 0.18},
        "intonation": "STABLE",
        "description": "Neutral declarative speech with balanced cadence, moderate modulation, and natural pauses."
    }
}

def generate_expected_delivery_profile(
    sentence_text: str,
    intents: List[Dict[str, Any]],
    sentence_role: str,
    context: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Synthesizes the recommended prosodic profile for a sentence given its
    communicative intent and structural role in the speech.
    Produces target ranges rather than rigid single values.
    """
    primary_intent = intents[0]["label"] if intents else "neutral_statement"
    base_profile = INTENT_PROSODIC_RANGES.get(primary_intent, INTENT_PROSODIC_RANGES["neutral_statement"])

    # Make a copy to customize based on role
    profile = {
        "primary_intent": primary_intent,
        "role": sentence_role,
        "description": base_profile["description"],
        "intonation": base_profile["intonation"],
        "pace_wpm": dict(base_profile["pace_wpm"]),
        "pitch_variation": dict(base_profile["pitch_variation"]),
        "energy": dict(base_profile["energy"]),
        "pause_before": dict(base_profile["pause_before"]),
        "pause_after": dict(base_profile["pause_after"]),
        "emphasis_strength": dict(base_profile["emphasis_strength"])
    }

    # Role adjustments
    if sentence_role == "conclusion":
        profile["pace_wpm"]["ideal"] = min(profile["pace_wpm"]["ideal"], 132)
        profile["pause_after"]["ideal"] = max(profile["pause_after"]["ideal"], 0.70)
        profile["emphasis_strength"]["ideal"] = max(profile["emphasis_strength"]["ideal"], 0.30)
        profile["intonation"] = "RESOLVED"
    elif sentence_role == "opening":
        profile["pace_wpm"]["ideal"] = min(profile["pace_wpm"]["ideal"], 138)
        profile["pause_before"]["ideal"] = max(profile["pause_before"]["ideal"], 0.40)
    elif sentence_role == "question":
        profile["intonation"] = "RISING"
        profile["pause_after"]["ideal"] = max(profile["pause_after"]["ideal"], 0.60)

    return profile
