from typing import Dict, Any, List

def generate_causal_explanation(flaw: Dict[str, Any]) -> Dict[str, str]:
    """
    Generates measurable, explainable causal feedback for a detected delivery flaw.
    Constructs exact Cause, Effect, Recommendation, and Judge Technical rationale.
    """
    flaw_type = flaw["type"]
    metrics = flaw.get("metrics", {})
    snippet = flaw.get("transcript_snippet", "this phrase")
    start_t = flaw["start"]
    end_t = flaw["end"]

    cause = ""
    effect = ""
    recommendation = ""

    if flaw_type == "RUSHED_DELIVERY":
        ref_wpm = metrics.get("referenceWpm", 130)
        part_wpm = metrics.get("participantWpm", 185)
        diff_pct = metrics.get("differencePercent", 42.0)
        cause = f"Participant speech rate was {part_wpm} WPM compared to reference {ref_wpm} WPM ({diff_pct:+.1f}% deviation)."
        effect = "This compresses syllable durations, blurs word boundaries, and removes necessary cognitive processing time for the audience."
        recommendation = f"Slow down the delivery during '{snippet}'. Add a conscious 300–400 ms breath pause after key emphasized nouns."

    elif flaw_type == "SLOW_DELIVERY":
        ref_wpm = metrics.get("referenceWpm", 135)
        part_wpm = metrics.get("participantWpm", 95)
        diff_pct = metrics.get("differencePercent", -29.6)
        cause = f"Speaking pace dropped to {part_wpm} WPM against baseline of {ref_wpm} WPM ({diff_pct:.1f}% deviation)."
        effect = "Prolonged phonetic elongation causes audience attention to wander and disrupts rhetorical momentum."
        recommendation = f"Pick up momentum on '{snippet}'. Maintain forward cadence while preserving clear consonant release."

    elif flaw_type == "MONOTONE":
        ref_std = metrics.get("referencePitchStdHz", 34.5)
        part_std = metrics.get("participantPitchStdHz", 11.2)
        cause = f"Pitch modulation spread was only {part_std} Hz vs reference {ref_std} Hz (substantially flatter intonation)."
        effect = "A flat pitch contour eliminates emotional contrast and makes pivotal arguments sound indifferent or robotic."
        recommendation = f"Inflect upward on critical emphasis words in '{snippet}', then resolve downward at the end of the clause."

    elif flaw_type == "EXCESSIVE_PITCH_VARIATION":
        ref_std = metrics.get("referencePitchStdHz", 28.0)
        part_std = metrics.get("participantPitchStdHz", 64.0)
        cause = f"Pitch variance swung up to {part_std} Hz vs reference baseline {ref_std} Hz."
        effect = "Erratic tonal shifts sound melodramatic or uncontrolled, reducing speaker authority."
        recommendation = f"Anchor your pitch around your natural speaking fundamental. Reserve wide pitch leaps strictly for climax moments in '{snippet}'."

    elif flaw_type == "LOW_VOLUME":
        db_diff = metrics.get("volumeDeltaDb", -7.5)
        cause = f"RMS vocal energy dropped by {abs(db_diff):.1f} dB relative to reference projection."
        effect = "Vocal projection faded, creating a perception of uncertainty or lack of conviction."
        recommendation = f"Support your breath from the diaphragm through '{snippet}'. Maintain consistent acoustic presence through the entire phrase."

    elif flaw_type == "EXCESSIVE_VOLUME":
        db_diff = metrics.get("volumeDeltaDb", 6.8)
        cause = f"RMS vocal energy exceeded the baseline by +{db_diff:.1f} dB."
        effect = "Overly intense projection risks sounding strained or harsh to the listener."
        recommendation = f"Temper vocal force on '{snippet}'. Rely on clean articulation and pause timing rather than pure loudness."

    elif flaw_type == "MISSING_PAUSE":
        ref_p = metrics.get("referencePauseDuration", 0.52)
        cause = f"Reference utilized a {ref_p}s rhetorical pause, whereas participant rushed directly without stopping."
        effect = "Important syntactic separation was lost, causing two distinct arguments to blend into one another."
        recommendation = f"Insert a clean 0.4s to 0.6s rhetorical silence immediately before '{snippet}' to frame the thought."

    elif flaw_type == "EXCESSIVE_PAUSE":
        part_p = metrics.get("participantPauseDuration", 1.8)
        cause = f"Participant paused for {part_p}s where the reference maintained fluent conversational flow."
        effect = "Unplanned dead air creates an awkward hesitation and conveys uncertainty about the upcoming words."
        recommendation = f"Tighten the hesitation gap before '{snippet}'. Bridge transitions smoothly without halting vocal momentum."

    elif flaw_type == "INCONSISTENT_ENERGY":
        cause = "RMS energy contour exhibited abrupt spikes and valleys compared to the steady baseline contour."
        effect = "Unpredictable loudness fluctuations disrupt the listener's auditory comfort."
        recommendation = f"Regulate breath support evenly across '{snippet}' so that phrase endings do not drop off abruptly."

    elif flaw_type == "WEAK_EMPHASIS":
        cause = "Participant delivery lacked the contrastive energy and pitch accent observed on the reference anchor point."
        effect = "The focal operative word in the sentence passed unnoticed without drawing listener focus."
        recommendation = f"Elevate both vocal pitch and dynamic stress specifically on the key operative word within '{snippet}'."

    else:
        cause = "Acoustic envelope and spectral distribution deviated significantly from the reference baseline."
        effect = "Timbral inconsistency or resonance instability detected in this interval."
        recommendation = f"Deliver '{snippet}' with relaxed vocal tract resonance and focused vowel placement."

    return {
        "cause": cause,
        "effect": effect,
        "recommendation": recommendation
    }

def enrich_flaws_with_explanations(flaws: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Enriches a list of detected flaws with comprehensive causal explanations."""
    enriched = []
    for f in flaws:
        exp = generate_causal_explanation(f)
        item = dict(f)
        item.update(exp)
        enriched.append(item)
    return enriched
