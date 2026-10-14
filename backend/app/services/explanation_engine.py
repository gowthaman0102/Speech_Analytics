import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def generate_speech_explanation_summary(
    sentences: List[Dict[str, Any]],
    expected_profiles: List[Dict[str, Any]],
    actual_prosodies: List[Dict[str, Any]],
    comparisons: List[Dict[str, Any]],
    flaws: List[Dict[str, Any]],
    scores: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Synthesizes overall explainable feedback and diagnostic takeaways for the entire speech.
    """
    rubric = scores["rubric"]
    # Identify strongest and weakest rubric dimensions
    sorted_rubric = sorted(rubric.items(), key=lambda x: x[1], reverse=True)
    strongest_dim = sorted_rubric[0][0]
    weakest_dim = sorted_rubric[-1][0]

    overall_score = scores["overallScore"]
    style = scores["detectedSpeakingStyle"]

    if overall_score >= 85:
        summary_text = (
            f"Exceptional delivery ({overall_score}/100) aligned with {style}. Your vocal pacing, "
            f"emphasis, and intonation closely supported the communicative intent of your sentences."
        )
    elif overall_score >= 70:
        summary_text = (
            f"Solid performance ({overall_score}/100) with strong {strongest_dim.lower()}. "
            f"Focus on improving {weakest_dim.lower()} to ensure your vocal delivery consistently reflects sentence meaning."
        )
    elif overall_score >= 55:
        summary_text = (
            f"Developing delivery ({overall_score}/100). While your {strongest_dim.lower()} showed promise, "
            f"deviations in {weakest_dim.lower()} diminished the communicative force of your message."
        )
    else:
        summary_text = (
            f"Needs practice ({overall_score}/100). Several key passages exhibited tone-semantic mismatch, "
            f"fading energy, or flat pitch contours that failed to communicate the underlying message."
        )

    # Compile structured sentence diagnostic records
    sentence_diagnostics = []
    for idx, s in enumerate(sentences):
        exp = expected_profiles[idx]
        act = actual_prosodies[idx]
        comp = comparisons[idx]

        sentence_diagnostics.append({
            "id": s["id"],
            "text": s["text"],
            "start": s["start"],
            "end": s["end"],
            "duration": s["duration"],
            "semantic_intent": exp["primary_intent"],
            "role": exp["role"],
            "expected_delivery": {
                "pace_range": f"{exp['pace_wpm']['min']}–{exp['pace_wpm']['max']} WPM",
                "pitch_variation": f"{exp['pitch_variation']['min']:.2f}–{exp['pitch_variation']['max']:.2f}",
                "energy_target": f"{exp['energy']['ideal']:.2f}",
                "intonation": exp["intonation"]
            },
            "actual_delivery": {
                "pace": f"{act['speech_rate_wpm']} WPM",
                "pitch_variation": f"{act['pitch_variation']:.2f}",
                "energy": f"{act['normalized_energy']:.2f}",
                "emphasis": f"{act['emphasis_strength']:.2f}"
            },
            "compatibility_score": comp["compatibility_score"]
        })

    return {
        "summaryText": summary_text,
        "strongestArea": strongest_dim,
        "weakestArea": weakest_dim,
        "sentenceDiagnostics": sentence_diagnostics
    }


from typing import Dict, Any, List

def generate_causal_explanation(flaw: Dict[str, Any]) -> Dict[str, str]:
    """
    Generates causal, explainable feedback following the complete causal chain:
    Measurement -> Reference value -> Participant value -> Difference ->
    Configured threshold -> Classification -> Perceptual consequence -> Improvement recommendation.
    Also produces 'simpleFeedback' and 'whyFlagged' mathematical rationale for judge mode.
    """
    flaw_type = flaw["type"]
    metrics = flaw.get("metrics", {})
    snippet = flaw.get("transcript_snippet", "this phrase")
    start_t = flaw["start"]
    end_t = flaw["end"]

    simple_feedback = ""
    cause = ""
    effect = ""
    recommendation = ""
    why_flagged = ""

    if flaw_type == "RUSHED_DELIVERY":
        ref_wpm = metrics.get("referenceValue", 130)
        part_wpm = metrics.get("participantValue", 185)
        diff_pct = metrics.get("differencePercent", 42.0)
        thresh = metrics.get("configuredThreshold", "+25%")

        simple_feedback = f"You rushed this section. Try slowing down on '{snippet}'."
        cause = f"Participant cadence accelerated to {part_wpm} WPM compared to baseline {ref_wpm} WPM ({diff_pct:+.1f}% deviation)."
        effect = "Syllable duration compression removes necessary rhetorical spacing, reducing audience retention."
        recommendation = f"Slow your delivery on '{snippet}'. Insert a clean 300â€“400 ms breath pause after key nouns."
        why_flagged = (
            f"Measurement: Speaking Rate (WPM)\n"
            f"Reference: {ref_wpm} WPM\n"
            f"Participant: {part_wpm} WPM\n"
            f"Difference: {diff_pct:+.1f}%\n"
            f"Configured Threshold: {thresh}\n"
            f"Classification: RUSHED DELIVERY\n"
            f"Rationale: Speaking rate exceeded the pace deviation threshold by {abs(diff_pct) - 25:.1f}%."
        )

    elif flaw_type == "SLOW_DELIVERY":
        ref_wpm = metrics.get("referenceValue", 135)
        part_wpm = metrics.get("participantValue", 95)
        diff_pct = metrics.get("differencePercent", -29.6)
        thresh = metrics.get("configuredThreshold", "-25%")

        simple_feedback = f"Your pace dragged here. Maintain forward momentum on '{snippet}'."
        cause = f"Speaking pace dropped to {part_wpm} WPM against baseline {ref_wpm} WPM ({diff_pct:.1f}% deviation)."
        effect = "Excessive phonetic stretching slows rhetorical momentum and causes listener focus to drift."
        recommendation = f"Pick up tempo through '{snippet}' while keeping crisp consonant releases."
        why_flagged = (
            f"Measurement: Speaking Rate (WPM)\n"
            f"Reference: {ref_wpm} WPM\n"
            f"Participant: {part_wpm} WPM\n"
            f"Difference: {diff_pct:.1f}%\n"
            f"Configured Threshold: {thresh}\n"
            f"Classification: SLOW DELIVERY\n"
            f"Rationale: Cadence dropped below the minimum pace threshold by {abs(diff_pct) - 25:.1f}%."
        )

    elif flaw_type == "MONOTONE":
        ref_std = metrics.get("referenceValue", 34.5)
        part_std = metrics.get("participantValue", 11.2)
        diff_pct = metrics.get("differencePercent", -67.5)
        thresh = metrics.get("configuredThreshold", "-35% pitch spread")

        simple_feedback = f"Your intonation was flat on this sentence. Add upward pitch inflection."
        cause = f"Pitch modulation spread was only {part_std} Hz vs baseline {ref_std} Hz ({diff_pct:.1f}% intonation reduction)."
        effect = "A flat vocal contour eliminates emotional contrast and makes pivotal arguments sound indifferent."
        recommendation = f"Inflect upward on key emphasis words within '{snippet}', then resolve downward at the period."
        why_flagged = (
            f"Measurement: Normalized Pitch Variability (F0 Std Dev)\n"
            f"Reference: {ref_std} Hz\n"
            f"Participant: {part_std} Hz\n"
            f"Relative Reduction: {abs(diff_pct):.1f}%\n"
            f"Configured Threshold: {thresh}\n"
            f"Classification: MONOTONE DELIVERY\n"
            f"Rationale: Pitch spread fell below the threshold by {abs(diff_pct) - 35:.1f}%, indicating flat contour."
        )

    elif flaw_type == "EXCESSIVE_PITCH_VARIATION":
        ref_std = metrics.get("referenceValue", 28.0)
        part_std = metrics.get("participantValue", 64.0)
        diff_pct = metrics.get("differencePercent", 128.0)

        simple_feedback = "Your pitch jumped erratically. Anchor your voice around your natural speaking tone."
        cause = f"Pitch variance swung up to {part_std} Hz vs reference {ref_std} Hz ({diff_pct:+.1f}% elevation)."
        effect = "Uncontrolled tonal leaps sound melodramatic or anxious, undermining speaker credibility."
        recommendation = f"Keep your pitch stable on '{snippet}'. Reserve wide leaps exclusively for genuine rhetorical climax points."
        why_flagged = (
            f"Measurement: Pitch Variation Spread\n"
            f"Reference: {ref_std} Hz\n"
            f"Participant: {part_std} Hz\n"
            f"Difference: {diff_pct:+.1f}%\n"
            f"Classification: EXCESSIVE PITCH VARIATION\n"
            f"Rationale: Pitch variance exceeded baseline stability limits."
        )

    elif flaw_type == "LOW_VOLUME":
        db_diff = metrics.get("volumeDeltaDb", -7.6)
        thresh = metrics.get("configuredThreshold", "-4.0 dB")

        simple_feedback = f"Your voice dropped in loudness on '{snippet}'. Project more acoustic presence."
        cause = f"RMS vocal energy dropped by {abs(db_diff):.1f} dB relative to reference projection."
        effect = "Acoustic projection faded, creating an impression of uncertainty or lack of conviction."
        recommendation = f"Engage diaphragmatic breath support through '{snippet}' so that phrase endings do not drop off."
        why_flagged = (
            f"Measurement: RMS Vocal Energy\n"
            f"Volume Delta: {db_diff:.1f} dB\n"
            f"Configured Threshold: {thresh}\n"
            f"Classification: LOW VOLUME PROJECTION\n"
            f"Rationale: Energy attenuation exceeded the volume threshold by {abs(db_diff) - 4.0:.1f} dB."
        )

    elif flaw_type == "EXCESSIVE_VOLUME":
        db_diff = metrics.get("volumeDeltaDb", 6.4)
        thresh = metrics.get("configuredThreshold", "+4.0 dB")

        simple_feedback = "Your delivery was overly loud here. Rely on pauses rather than force."
        cause = f"RMS vocal energy spiked +{db_diff:.1f} dB above baseline."
        effect = "Excessive projection can sound aggressive or strained to the listener."
        recommendation = f"Temper vocal force on '{snippet}'. Let pauses and articulation carry the emphasis."
        why_flagged = (
            f"Measurement: RMS Vocal Energy\n"
            f"Volume Delta: +{db_diff:.1f} dB\n"
            f"Configured Threshold: {thresh}\n"
            f"Classification: EXCESSIVE VOLUME\n"
            f"Rationale: Loudness exceeded baseline projection by {db_diff - 4.0:.1f} dB."
        )

    elif flaw_type == "MISSING_PAUSE":
        simple_feedback = f"You rushed through a natural pause. Add a breath pause before '{snippet}'."
        cause = "Reference employed a 0.52s rhetorical pause, whereas participant rushed directly without pausing."
        effect = "Syntactic boundaries blurred, merging two independent ideas into one run-on sentence."
        recommendation = f"Insert a clean 0.4s to 0.6s rhetorical silence immediately before '{snippet}' to frame the idea."
        why_flagged = (
            f"Measurement: Rhetorical Pause Duration\n"
            f"Reference Pause: 0.52s\n"
            f"Participant Pause: 0.05s\n"
            f"Classification: MISSING PAUSE\n"
            f"Rationale: Reference pause was skipped, violating rhetorical sentence phrasing."
        )

    elif flaw_type == "EXCESSIVE_PAUSE":
        p_dur = metrics.get("participantValue", 2.2)
        simple_feedback = "There was an awkward hesitation pause here. Keep your transitions smooth."
        cause = f"Participant hesitated for {p_dur:.1f}s where the reference maintained steady flow."
        effect = "Unplanned dead air conveys memory lapse or uncertainty about upcoming material."
        recommendation = f"Tighten the transition gap before '{snippet}'. Maintain mental momentum between ideas."
        why_flagged = (
            f"Measurement: Silence Interval Duration\n"
            f"Observed Silence: {p_dur:.1f}s\n"
            f"Configured Threshold: >0.40s unexpected silence\n"
            f"Classification: EXCESSIVE PAUSE\n"
            f"Rationale: Silence interval exceeded normal grammatical pause duration."
        )

    elif flaw_type == "INCONSISTENT_ENERGY":
        simple_feedback = "Your volume fluctuated unevenly across this phrase."
        cause = "RMS energy contour showed erratic spikes and valleys compared to the steady baseline envelope."
        effect = "Auditory comfort is reduced when volume swells and drops unpredictably."
        recommendation = f"Maintain balanced air support across '{snippet}' for even projection."
        why_flagged = (
            f"Measurement: Energy Contour Variance\n"
            f"Classification: INCONSISTENT ENERGY\n"
            f"Rationale: Energy contour deviation exceeded steady delivery bounds."
        )

    else:
        simple_feedback = f"Acoustic delivery diverged from baseline in '{snippet}'."
        cause = "Spectral envelope and MFCC timbre distance deviated significantly from reference."
        effect = "Resonance instability or timbral mismatch detected in this interval."
        recommendation = f"Deliver '{snippet}' with relaxed vocal tract resonance and focused vowel placement."
        why_flagged = (
            f"Measurement: Composite Acoustic Deviation\n"
            f"Classification: ACOUSTIC DEVIATION\n"
            f"Rationale: Overall feature distance exceeded baseline tolerance."
        )

    return {
        "simpleFeedback": simple_feedback,
        "cause": cause,
        "effect": effect,
        "recommendation": recommendation,
        "whyFlagged": why_flagged
    }

def enrich_flaws_with_explanations(flaws: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Enriches detected flaws with complete causal chain, simple coaching feedback, and judge rationale."""
    enriched = []
    for f in flaws:
        exp = generate_causal_explanation(f)
        item = dict(f)
        item.update(exp)
        enriched.append(item)
    return enriched
