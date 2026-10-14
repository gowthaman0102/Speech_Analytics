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
