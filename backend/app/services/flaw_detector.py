import uuid
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

def detect_semantic_prosodic_flaws(
    sentences: List[Dict[str, Any]],
    expected_profiles: List[Dict[str, Any]],
    actual_prosodies: List[Dict[str, Any]],
    comparisons: List[Dict[str, Any]],
    important_words_per_sentence: List[List[Dict[str, Any]]]
) -> List[Dict[str, Any]]:
    """
    Evaluates measurable evidence to classify sub-second temporal flaw regions
    grounded in semantic communicative mismatch.
    """
    flaws = []

    for idx, sentence in enumerate(sentences):
        exp = expected_profiles[idx]
        act = actual_prosodies[idx]
        comp = comparisons[idx]
        devs = comp["deviations"]
        dirs = comp["directions"]
        keywords = important_words_per_sentence[idx]

        s_text = sentence["text"]
        s_start = sentence["start"]
        s_end = sentence["end"]
        s_dur = sentence["duration"]
        intent = exp["primary_intent"]
        role = exp["role"]

        # 1. TONE_SEMANTIC_MISMATCH (Urgent / Persuasive / Motivational delivered flat and quiet)
        if intent in ("urgent", "call_to_action", "persuasive", "serious") and devs["pitch"] >= 0.45 and devs["energy"] >= 0.40:
            flaws.append({
                "id": str(uuid.uuid4()),
                "sentence_id": sentence["id"],
                "start": s_start,
                "end": s_end,
                "duration": round(s_dur, 2),
                "type": "TONE_SEMANTIC_MISMATCH",
                "severity": "HIGH",
                "transcript": s_text,
                "semantic_intent": intent,
                "cause": f"The sentence conveys '{intent.replace('_', ' ')}', but actual pitch variation was {act['pitch_variation']} (expected >= {exp['pitch_variation']['min']}) with muted energy.",
                "effect": "Audience perceives emotional indifference or lack of genuine conviction in the core message.",
                "recommendation": "Elevate vocal commitment: lean into key clauses with stronger chest resonance and dynamic pitch modulation.",
                "metrics": [
                    {
                        "name": "Pitch Modulation",
                        "unit": "ratio",
                        "reference_val": exp["pitch_variation"]["ideal"],
                        "participant_val": act["pitch_variation"],
                        "delta_pct": round(((act["pitch_variation"] - exp["pitch_variation"]["ideal"]) / exp["pitch_variation"]["ideal"]) * 100, 1),
                        "direction": "LOWER"
                    },
                    {
                        "name": "Vocal Energy",
                        "unit": "norm",
                        "reference_val": exp["energy"]["ideal"],
                        "participant_val": act["normalized_energy"],
                        "delta_pct": round(((act["normalized_energy"] - exp["energy"]["ideal"]) / exp["energy"]["ideal"]) * 100, 1),
                        "direction": "LOWER"
                    }
                ]
            })
            continue

        # 2. WEAK_QUESTION_INTONATION (Question without terminal inflection)
        if (sentence.get("is_question") or intent == "question" or role == "question") and devs["intonation"] >= 0.40:
            flaws.append({
                "id": str(uuid.uuid4()),
                "sentence_id": sentence["id"],
                "start": max(s_start, round(s_end - 1.2, 2)),
                "end": s_end,
                "duration": round(min(s_dur, 1.2), 2),
                "type": "WEAK_QUESTION_INTONATION",
                "severity": "MEDIUM",
                "transcript": s_text,
                "semantic_intent": "question",
                "cause": f"Terminal pitch inflection dropped by {abs(act['final_pitch_delta_hz'])} Hz instead of rising to signal inquiry.",
                "effect": "The question lands like a flat statement, failing to trigger rhetorical engagement from the audience.",
                "recommendation": "Lift your pitch upwards on the final syllable of the question and pause to let the inquiry land.",
                "metrics": [
                    {
                        "name": "Final Pitch Movement",
                        "unit": "Hz",
                        "reference_val": 15.0,
                        "participant_val": act["final_pitch_delta_hz"],
                        "delta_pct": -100.0 if act["final_pitch_delta_hz"] <= 0 else -50.0,
                        "direction": "FALLING"
                    }
                ]
            })

        # 3. WEAK_EMPHASIS (Important focal words delivered without prominence)
        if keywords and devs["emphasis"] >= 0.55:
            kw_names = ", ".join([f"'{k['word']}'" for k in keywords[:2]])
            flaws.append({
                "id": str(uuid.uuid4()),
                "sentence_id": sentence["id"],
                "start": keywords[0]["start"],
                "end": keywords[0]["end"],
                "duration": round(keywords[0]["end"] - keywords[0]["start"], 2),
                "type": "WEAK_EMPHASIS",
                "severity": "MEDIUM",
                "transcript": s_text,
                "semantic_intent": intent,
                "cause": f"Key focal words ({kw_names}) received only {act['emphasis_strength']:.2f} relative energy prominence (expected >= {exp['emphasis_strength']['min']}).",
                "effect": "The core thematic takeaway is buried among grammatical helper words without focal hierarchy.",
                "recommendation": f"Add intentional vocal punch: increase volume and slightly stretch duration on {kw_names}.",
                "metrics": [
                    {
                        "name": "Keyword Prominence",
                        "unit": "delta",
                        "reference_val": exp["emphasis_strength"]["ideal"],
                        "participant_val": act["emphasis_strength"],
                        "delta_pct": round(((act["emphasis_strength"] - exp["emphasis_strength"]["ideal"]) / max(0.01, exp["emphasis_strength"]["ideal"])) * 100, 1),
                        "direction": "UNDER_EMPHASIZED"
                    }
                ]
            })

        # 4. RUSHED_DELIVERY (Cadence exceeds upper bound)
        if dirs["pace"] == "TOO_FAST" and devs["pace"] >= 0.40:
            severity = "HIGH" if devs["pace"] >= 0.65 else "MEDIUM"
            flaws.append({
                "id": str(uuid.uuid4()),
                "sentence_id": sentence["id"],
                "start": s_start,
                "end": s_end,
                "duration": round(s_dur, 2),
                "type": "RUSHED_DELIVERY",
                "severity": severity,
                "transcript": s_text,
                "semantic_intent": intent,
                "cause": f"Speaking rate reached {act['speech_rate_wpm']} WPM, exceeding recommended ceiling of {exp['pace_wpm']['max']} WPM.",
                "effect": "Rapid delivery denies listeners time to process complex arguments or emotional weight.",
                "recommendation": "Insert deliberate micro-pauses at clause boundaries to anchor delivery near 140 WPM.",
                "metrics": [
                    {
                        "name": "Speaking Cadence",
                        "unit": "WPM",
                        "reference_val": exp["pace_wpm"]["ideal"],
                        "participant_val": act["speech_rate_wpm"],
                        "delta_pct": round(((act["speech_rate_wpm"] - exp["pace_wpm"]["ideal"]) / exp["pace_wpm"]["ideal"]) * 100, 1),
                        "direction": "RUSHED"
                    }
                ]
            })

        # 5. SLOW_DELIVERY (Dragging cadence)
        elif dirs["pace"] == "TOO_SLOW" and devs["pace"] >= 0.45:
            flaws.append({
                "id": str(uuid.uuid4()),
                "sentence_id": sentence["id"],
                "start": s_start,
                "end": s_end,
                "duration": round(s_dur, 2),
                "type": "SLOW_DELIVERY",
                "severity": "LOW",
                "transcript": s_text,
                "semantic_intent": intent,
                "cause": f"Cadence dropped to {act['speech_rate_wpm']} WPM, dragging noticeably behind the natural 125-155 WPM baseline.",
                "effect": "Excessively sluggish pacing risks losing audience attention and momentum.",
                "recommendation": "Maintain brisk forward momentum across declarative sentences.",
                "metrics": [
                    {
                        "name": "Speaking Cadence",
                        "unit": "WPM",
                        "reference_val": exp["pace_wpm"]["ideal"],
                        "participant_val": act["speech_rate_wpm"],
                        "delta_pct": round(((act["speech_rate_wpm"] - exp["pace_wpm"]["ideal"]) / exp["pace_wpm"]["ideal"]) * 100, 1),
                        "direction": "DRAGGING"
                    }
                ]
            })

        # 6. MONOTONE_DELIVERY (Pitch standard deviation suppressed)
        if dirs["pitch"] == "TOO_FLAT" and devs["pitch"] >= 0.50:
            flaws.append({
                "id": str(uuid.uuid4()),
                "sentence_id": sentence["id"],
                "start": s_start,
                "end": s_end,
                "duration": round(s_dur, 2),
                "type": "MONOTONE_DELIVERY",
                "severity": "HIGH" if devs["pitch"] >= 0.70 else "MEDIUM",
                "transcript": s_text,
                "semantic_intent": intent,
                "cause": f"Pitch variation was measured at {act['pitch_variation']} (flat robotic baseline), well below the {exp['pitch_variation']['min']} threshold.",
                "effect": "Monotone cadence causes auditory fatigue and fails to project interpretive color.",
                "recommendation": "Vary pitch contours between introductory phrases and climax points.",
                "metrics": [
                    {
                        "name": "Pitch Modulation",
                        "unit": "ratio",
                        "reference_val": exp["pitch_variation"]["ideal"],
                        "participant_val": act["pitch_variation"],
                        "delta_pct": round(((act["pitch_variation"] - exp["pitch_variation"]["ideal"]) / exp["pitch_variation"]["ideal"]) * 100, 1),
                        "direction": "MONOTONE"
                    }
                ]
            })

        # 7. LOW_ENERGY (Muted projection)
        if dirs["energy"] == "TOO_QUIET" and devs["energy"] >= 0.50:
            flaws.append({
                "id": str(uuid.uuid4()),
                "sentence_id": sentence["id"],
                "start": s_start,
                "end": s_end,
                "duration": round(s_dur, 2),
                "type": "LOW_ENERGY",
                "severity": "MEDIUM",
                "transcript": s_text,
                "semantic_intent": intent,
                "cause": f"Normalized vocal projection fell to {act['normalized_energy']} (fading power).",
                "effect": "Speech fails to project across competitive auditorium acoustics.",
                "recommendation": "Support vocal projection from the diaphragm and maintain consistent volume through sentence conclusions.",
                "metrics": [
                    {
                        "name": "Vocal Energy",
                        "unit": "norm",
                        "reference_val": exp["energy"]["ideal"],
                        "participant_val": act["normalized_energy"],
                        "delta_pct": round(((act["normalized_energy"] - exp["energy"]["ideal"]) / exp["energy"]["ideal"]) * 100, 1),
                        "direction": "LOW_ENERGY"
                    }
                ]
            })

        # 8. EXCESSIVE_PAUSE (Dead air hesitation)
        if dirs["pause"] == "EXCESSIVE_PAUSE" and sentence["pause_after"] >= 1.2:
            p_start = s_end
            p_end = round(s_end + sentence["pause_after"], 2)
            flaws.append({
                "id": str(uuid.uuid4()),
                "sentence_id": sentence["id"],
                "start": p_start,
                "end": p_end,
                "duration": round(sentence["pause_after"], 2),
                "type": "EXCESSIVE_PAUSE",
                "severity": "HIGH" if sentence["pause_after"] >= 2.0 else "MEDIUM",
                "transcript": s_text,
                "semantic_intent": intent,
                "cause": f"Unplanned silence of {sentence['pause_after']:.1f}s exceeded rhetorical pause tolerances.",
                "effect": "Protracted dead air signals memory lapse or hesitation.",
                "recommendation": "Bridge thoughts smoothly; reserve long pauses only for major rhetorical act breaks.",
                "metrics": [
                    {
                        "name": "Pause Duration",
                        "unit": "seconds",
                        "reference_val": exp["pause_after"]["ideal"],
                        "participant_val": sentence["pause_after"],
                        "delta_pct": round(((sentence["pause_after"] - exp["pause_after"]["ideal"]) / exp["pause_after"]["ideal"]) * 100, 1),
                        "direction": "DEAD_AIR"
                    }
                ]
            })

        # 9. WEAK_CONCLUSION (Final sentence lacks resolution)
        if role == "conclusion" and (devs["pace"] >= 0.35 or devs["energy"] >= 0.40):
            flaws.append({
                "id": str(uuid.uuid4()),
                "sentence_id": sentence["id"],
                "start": s_start,
                "end": s_end,
                "duration": round(s_dur, 2),
                "type": "WEAK_CONCLUSION",
                "severity": "MEDIUM",
                "transcript": s_text,
                "semantic_intent": "conclusion",
                "cause": "Concluding resolution rushed past without authoritative finality or resonant closing energy.",
                "effect": "The speech ends abruptly rather than leaving a lasting persuasive impression.",
                "recommendation": "Decelerate pace on the final sentence, plant your feet, and hold the closing word with steady volume.",
                "metrics": [
                    {
                        "name": "Conclusion Pace",
                        "unit": "WPM",
                        "reference_val": 128.0,
                        "participant_val": act["speech_rate_wpm"],
                        "delta_pct": round(((act["speech_rate_wpm"] - 128.0) / 128.0) * 100, 1),
                        "direction": "RUSHED_FINALE"
                    }
                ]
            })

    # Sort flaws chronologically by start timestamp
    flaws.sort(key=lambda x: x["start"])
    logger.info("Detected %d semantic delivery flaws.", len(flaws))
    return flaws


import numpy as np
from typing import List, Dict, Any
from ..config import settings

def detect_delivery_flaws(
    time_analysis: Dict[str, Any],
    ref_features: Dict[str, Any],
    part_features: Dict[str, Any],
    words_alignment: List[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Detects and classifies temporal delivery flaws using feature deviations.
    Segments exceeding deviation threshold for >= 400ms are marked as flaw candidates.
    Adjacent flaw intervals within 500ms are merged.
    Each candidate is classified into a specific delivery flaw based on acoustic evidence.
    """
    time_points = time_analysis["time_points"]
    combined_devs = time_analysis["deviations"]["combined"]
    part_mapped_times = time_analysis["part_mapped_times"]
    
    p_devs = time_analysis["deviations"]["pitch"]
    e_devs = time_analysis["deviations"]["energy"]
    r_devs = time_analysis["deviations"]["rate"]
    pause_devs = time_analysis["deviations"]["pause"]

    # Candidate anomaly score: flags multi-feature deviation or prominent single-feature spikes
    anomaly_scores = [
        max(combined_devs[i], 0.72 * max(p_devs[i], e_devs[i], r_devs[i], pause_devs[i]))
        for i in range(len(combined_devs))
    ]
    
    threshold = settings.FLAW_COMPOSITE_THRESHOLD
    min_frames = max(2, int(settings.FLAW_MIN_DURATION_SEC / 0.25))  # >= 0.4s
    merge_gap_frames = max(1, int(settings.FLAW_MERGE_GAP_SEC / 0.25)) # <= 0.5s
    
    # 1. Identify raw contiguous high-deviation segments
    raw_segments = []
    in_flaw = False
    start_idx = 0
    
    for i, score in enumerate(anomaly_scores):
        if score >= threshold and not in_flaw:
            in_flaw = True
            start_idx = i
        elif score < threshold and in_flaw:
            in_flaw = False
            if (i - start_idx) >= min_frames:
                raw_segments.append((start_idx, i - 1))
                
    if in_flaw and (len(anomaly_scores) - start_idx) >= min_frames:
        raw_segments.append((start_idx, len(anomaly_scores) - 1))
        
    # 2. Merge adjacent segments separated by gap <= merge_gap_frames
    merged_segments = []
    if raw_segments:
        curr_start, curr_end = raw_segments[0]
        for next_start, next_end in raw_segments[1:]:
            if (next_start - curr_end) <= merge_gap_frames:
                curr_end = next_end
            else:
                merged_segments.append((curr_start, curr_end))
                curr_start, curr_end = next_start, next_end
        merged_segments.append((curr_start, curr_end))
        
    # 3. Classify each segment based on measurable acoustic differences
    flaws = []
    flaw_counter = 1
    
    for s_idx, e_idx in merged_segments:
        # Ref & Part timestamps
        ref_t_start = time_points[s_idx]
        ref_t_end = time_points[e_idx]
        
        part_t_start = part_mapped_times[s_idx]
        part_t_end = part_mapped_times[e_idx]
        flaw_dur = round(max(part_t_end - part_t_start, ref_t_end - ref_t_start), 2)
        if flaw_dur < settings.FLAW_MIN_DURATION_SEC:
            continue
            
        # Segment slice
        seg_devs = combined_devs[s_idx:e_idx+1]
        mean_dev = float(np.mean(seg_devs))
        
        # Segment acoustic features
        ref_p_seg = [p for p in ref_features["pitch"][s_idx:e_idx+1] if p > 0]
        part_p_seg = [p for p in part_features["pitch"][s_idx:e_idx+1] if p > 0]
        
        ref_p_std = float(np.std(ref_p_seg)) if len(ref_p_seg) > 1 else 12.0
        part_p_std = float(np.std(part_p_seg)) if len(part_p_seg) > 1 else 1.0
        pitch_ratio = float(part_p_std / max(1.0, ref_p_std))
        pitch_diff_pct = round((pitch_ratio - 1.0) * 100.0, 1)
        
        ref_e_seg = ref_features["rms"][s_idx:e_idx+1]
        part_e_seg = part_features["rms"][s_idx:e_idx+1]
        ref_e_mean = float(np.mean(ref_e_seg)) if len(ref_e_seg) > 0 else 0.1
        part_e_mean = float(np.mean(part_e_seg)) if len(part_e_seg) > 0 else 0.1
        volume_delta_db = round(20.0 * np.log10(max(1e-4, part_e_mean / max(1e-4, ref_e_mean))), 1)
        
        ref_wpm_seg = float(np.mean(ref_features["wpm_series"][s_idx:e_idx+1]))
        part_wpm_seg = float(np.mean(part_features["wpm_series"][s_idx:e_idx+1]))
        wpm_diff_pct = round(((part_wpm_seg - ref_wpm_seg) / max(60.0, ref_wpm_seg)) * 100.0, 1)
        
        # Pauses within or near this segment
        ref_has_pause = any(ref_t_start - 0.3 <= p["start"] <= ref_t_end + 0.3 for p in ref_features["pauses"])
        part_has_pause = any(part_t_start - 0.3 <= p["start"] <= part_t_end + 0.3 for p in part_features["pauses"])
        
        # Sub-deviations
        p_dev = float(np.mean(p_devs[s_idx:e_idx+1]))
        e_dev = float(np.mean(e_devs[s_idx:e_idx+1]))
        r_dev = float(np.mean(r_devs[s_idx:e_idx+1]))
        pause_dev = float(np.mean(pause_devs[s_idx:e_idx+1]))
        mfcc_dev = float(np.mean(time_analysis["deviations"]["mfcc"][s_idx:e_idx+1]))

        # Classification decision hierarchy based on primary acoustic driver & thresholds
        flaw_type = "ACOUSTIC_DEVIATION"
        metrics: Dict[str, Any] = {}
        
        pace_threshold_pct = settings.PACE_DEVIATION_THRESHOLD * 100.0 # 25%
        pitch_threshold_ratio = 1.0 - settings.PITCH_VARIANCE_THRESHOLD # 0.65
        energy_threshold_db = 4.0 # dB

        if ref_has_pause and not part_has_pause and (r_dev > 0.30 or pause_dev > 0.40):
            flaw_type = "MISSING_PAUSE"
            metrics = {
                "featureName": "Rhetorical Pause Duration",
                "referenceValue": 0.52,
                "participantValue": 0.05,
                "difference": "-0.47s",
                "configuredThreshold": f">{settings.PAUSE_DEVIATION_THRESHOLD}s gap",
                "speakingRateWpm": round(part_wpm_seg, 1)
            }
        elif part_has_pause and not ref_has_pause and flaw_dur >= 0.8:
            flaw_type = "EXCESSIVE_PAUSE"
            metrics = {
                "featureName": "Silence Interval Duration",
                "referenceValue": 0.0,
                "participantValue": flaw_dur,
                "difference": f"+{flaw_dur:.1f}s",
                "configuredThreshold": f">{settings.PAUSE_DEVIATION_THRESHOLD}s unexpected pause",
                "expectedContinuation": True
            }
        elif wpm_diff_pct >= pace_threshold_pct:
            flaw_type = "RUSHED_DELIVERY"
            metrics = {
                "featureName": "Speaking Rate (WPM)",
                "referenceValue": round(ref_wpm_seg, 1),
                "participantValue": round(part_wpm_seg, 1),
                "differencePercent": wpm_diff_pct,
                "configuredThreshold": f"+{pace_threshold_pct:.0f}%"
            }
        elif wpm_diff_pct <= -pace_threshold_pct:
            flaw_type = "SLOW_DELIVERY"
            metrics = {
                "featureName": "Speaking Rate (WPM)",
                "referenceValue": round(ref_wpm_seg, 1),
                "participantValue": round(part_wpm_seg, 1),
                "differencePercent": wpm_diff_pct,
                "configuredThreshold": f"-{pace_threshold_pct:.0f}%"
            }
        elif pitch_ratio <= pitch_threshold_ratio and len(part_p_seg) >= 2:
            flaw_type = "MONOTONE"
            metrics = {
                "featureName": "Normalized Pitch Variability (F0 Std Dev)",
                "referenceValue": round(ref_p_std, 1),
                "participantValue": round(part_p_std, 1),
                "variationRatio": round(pitch_ratio, 2),
                "differencePercent": pitch_diff_pct,
                "configuredThreshold": f"-{settings.PITCH_VARIANCE_THRESHOLD * 100:.0f}% pitch spread"
            }
        elif pitch_ratio >= 1.65:
            flaw_type = "EXCESSIVE_PITCH_VARIATION"
            metrics = {
                "featureName": "Pitch Variation Spread",
                "referenceValue": round(ref_p_std, 1),
                "participantValue": round(part_p_std, 1),
                "differencePercent": pitch_diff_pct,
                "configuredThreshold": "+65% pitch spread"
            }
        elif volume_delta_db <= -energy_threshold_db:
            flaw_type = "LOW_VOLUME"
            metrics = {
                "featureName": "RMS Vocal Energy",
                "referenceValue": round(ref_e_mean, 3),
                "participantValue": round(part_e_mean, 3),
                "volumeDeltaDb": volume_delta_db,
                "configuredThreshold": f"-{energy_threshold_db:.1f} dB"
            }
        elif volume_delta_db >= energy_threshold_db:
            flaw_type = "EXCESSIVE_VOLUME"
            metrics = {
                "featureName": "RMS Vocal Energy",
                "referenceValue": round(ref_e_mean, 3),
                "participantValue": round(part_e_mean, 3),
                "volumeDeltaDb": volume_delta_db,
                "configuredThreshold": f"+{energy_threshold_db:.1f} dB"
            }
        elif e_dev > settings.ENERGY_DEVIATION_THRESHOLD:
            flaw_type = "INCONSISTENT_ENERGY"
            metrics = {
                "featureName": "Energy Contour Deviation",
                "referenceValue": round(ref_e_mean, 3),
                "participantValue": round(part_e_mean, 3),
                "energyDeviation": round(e_dev, 2),
                "configuredThreshold": f">{settings.ENERGY_DEVIATION_THRESHOLD}"
            }
        else:
            flaw_type = "WEAK_EMPHASIS" if mean_dev > 0.55 else "ACOUSTIC_DEVIATION"
            metrics = {
                "featureName": "Composite Spectral Deviation",
                "combinedDeviation": round(mean_dev, 2),
                "mfccDeviation": round(mfcc_dev, 2),
                "pitchDeviation": round(p_dev, 2),
                "configuredThreshold": f">{settings.FLAW_COMPOSITE_THRESHOLD}"
            }
            
        # Determine Severity based on deviation magnitude
        if mean_dev >= 0.65 or abs(wpm_diff_pct) >= 45 or volume_delta_db <= -8.0:
            severity = "HIGH"
        elif mean_dev >= 0.45 or abs(wpm_diff_pct) >= 28 or volume_delta_db <= -5.0:
            severity = "MEDIUM"
        else:
            severity = "LOW"
            
        # Find intersecting transcript words for temporal grounding
        snippet_words = []
        if words_alignment:
            for w in words_alignment:
                if (w["part_start"] <= part_t_end and w["part_end"] >= part_t_start):
                    snippet_words.append(w["word"])
        snippet = " ".join(snippet_words) if snippet_words else f"Segment {part_t_start:.1f}s to {part_t_end:.1f}s"

        flaws.append({
            "id": f"flaw_{flaw_counter:02d}",
            "start": round(part_t_start, 2),
            "end": round(part_t_end, 2),
            "duration": flaw_dur,
            "type": flaw_type,
            "severity": severity,
            "mean_deviation": round(mean_dev, 2),
            "transcript_snippet": snippet,
            "metrics": metrics
        })
        flaw_counter += 1

    return flaws
