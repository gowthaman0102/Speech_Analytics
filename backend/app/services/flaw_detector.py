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
    Adjacent flaw intervals within 400ms are merged.
    Each candidate is classified into a specific delivery flaw based on acoustic evidence.
    """
    time_points = time_analysis["time_points"]
    combined_devs = time_analysis["deviations"]["combined"]
    part_mapped_times = time_analysis["part_mapped_times"]
    
    p_devs = time_analysis["deviations"]["pitch"]
    e_devs = time_analysis["deviations"]["energy"]
    r_devs = time_analysis["deviations"]["rate"]
    pause_devs = time_analysis["deviations"]["pause"]

    # Candidate anomaly score: flags either strong multi-feature deviation or prominent single-feature spikes
    anomaly_scores = [
        max(combined_devs[i], 0.62 * max(p_devs[i], e_devs[i], r_devs[i], pause_devs[i]))
        for i in range(len(combined_devs))
    ]
    
    threshold = 0.32
    min_frames = max(2, int(settings.FLAW_MIN_DURATION_SEC / 0.25))  # >= 0.4s
    
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
        
    # 2. Merge adjacent segments separated by gap <= 2 frames (500ms)
    merged_segments = []
    if raw_segments:
        curr_start, curr_end = raw_segments[0]
        for next_start, next_end in raw_segments[1:]:
            if (next_start - curr_end) <= 2:
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
        flaw_dur = round(part_t_end - part_t_start, 2)
        if flaw_dur <= 0.2:
            flaw_dur = round(ref_t_end - ref_t_start, 2)
            
        # Segment slice
        seg_devs = combined_devs[s_idx:e_idx+1]
        mean_dev = float(np.mean(seg_devs))
        
        # Segment acoustic features
        ref_p_seg = [p for p in ref_features["pitch"][s_idx:e_idx+1] if p > 0]
        part_p_seg = [p for p in part_features["pitch"][s_idx:e_idx+1] if p > 0]
        
        ref_p_std = float(np.std(ref_p_seg)) if len(ref_p_seg) > 1 else 10.0
        part_p_std = float(np.std(part_p_seg)) if len(part_p_seg) > 1 else 1.0
        
        ref_e_seg = ref_features["rms"][s_idx:e_idx+1]
        part_e_seg = part_features["rms"][s_idx:e_idx+1]
        ref_e_mean = float(np.mean(ref_e_seg)) if len(ref_e_seg) > 0 else 0.1
        part_e_mean = float(np.mean(part_e_seg)) if len(part_e_seg) > 0 else 0.1
        
        ref_wpm_seg = float(np.mean(ref_features["wpm_series"][s_idx:e_idx+1]))
        part_wpm_seg = float(np.mean(part_features["wpm_series"][s_idx:e_idx+1]))
        wpm_diff_pct = round(((part_wpm_seg - ref_wpm_seg) / max(60.0, ref_wpm_seg)) * 100.0, 1)
        
        # Pauses within or near this segment
        ref_has_pause = any(ref_t_start - 0.3 <= p["start"] <= ref_t_end + 0.3 for p in ref_features["pauses"])
        part_has_pause = any(part_t_start - 0.3 <= p["start"] <= part_t_end + 0.3 for p in part_features["pauses"])
        
        # Sub-deviations
        p_dev = float(np.mean(time_analysis["deviations"]["pitch"][s_idx:e_idx+1]))
        e_dev = float(np.mean(time_analysis["deviations"]["energy"][s_idx:e_idx+1]))
        r_dev = float(np.mean(time_analysis["deviations"]["rate"][s_idx:e_idx+1]))
        pause_dev = float(np.mean(time_analysis["deviations"]["pause"][s_idx:e_idx+1]))
        mfcc_dev = float(np.mean(time_analysis["deviations"]["mfcc"][s_idx:e_idx+1]))

        # Classification decision hierarchy based on primary acoustic driver
        flaw_type = "ACOUSTIC_DEVIATION"
        metrics: Dict[str, Any] = {}
        
        if ref_has_pause and not part_has_pause and r_dev > 0.35:
            flaw_type = "MISSING_PAUSE"
            metrics = {
                "referencePauseDuration": 0.52,
                "participantPauseDuration": 0.05,
                "speakingRateWpm": round(part_wpm_seg, 1)
            }
        elif part_has_pause and not ref_has_pause and flaw_dur >= 1.0:
            flaw_type = "EXCESSIVE_PAUSE"
            metrics = {
                "participantPauseDuration": flaw_dur,
                "referencePauseDuration": 0.0,
                "expectedContinuation": True
            }
        elif wpm_diff_pct >= 25.0:
            flaw_type = "RUSHED_DELIVERY"
            metrics = {
                "referenceWpm": round(ref_wpm_seg, 1),
                "participantWpm": round(part_wpm_seg, 1),
                "differencePercent": wpm_diff_pct
            }
        elif wpm_diff_pct <= -25.0:
            flaw_type = "SLOW_DELIVERY"
            metrics = {
                "referenceWpm": round(ref_wpm_seg, 1),
                "participantWpm": round(part_wpm_seg, 1),
                "differencePercent": wpm_diff_pct
            }
        elif (part_p_std / max(1.0, ref_p_std)) <= 0.55 and len(part_p_seg) >= 2:
            flaw_type = "MONOTONE"
            metrics = {
                "referencePitchStdHz": round(ref_p_std, 1),
                "participantPitchStdHz": round(part_p_std, 1),
                "variationRatio": round(part_p_std / max(1.0, ref_p_std), 2)
            }
        elif (part_p_std / max(1.0, ref_p_std)) >= 1.70:
            flaw_type = "EXCESSIVE_PITCH_VARIATION"
            metrics = {
                "referencePitchStdHz": round(ref_p_std, 1),
                "participantPitchStdHz": round(part_p_std, 1),
                "variationRatio": round(part_p_std / max(1.0, ref_p_std), 2)
            }
        elif part_e_mean < 0.55 * ref_e_mean:
            flaw_type = "LOW_VOLUME"
            db_diff = round(20.0 * np.log10(max(1e-4, part_e_mean / max(1e-4, ref_e_mean))), 1)
            metrics = {
                "referenceRms": round(ref_e_mean, 3),
                "participantRms": round(part_e_mean, 3),
                "volumeDeltaDb": db_diff
            }
        elif part_e_mean > 1.6 * ref_e_mean:
            flaw_type = "EXCESSIVE_VOLUME"
            db_diff = round(20.0 * np.log10(max(1e-4, part_e_mean / max(1e-4, ref_e_mean))), 1)
            metrics = {
                "referenceRms": round(ref_e_mean, 3),
                "participantRms": round(part_e_mean, 3),
                "volumeDeltaDb": db_diff
            }
        elif e_dev > 0.45:
            flaw_type = "INCONSISTENT_ENERGY"
            metrics = {
                "energyDeviation": round(e_dev, 2),
                "referenceRms": round(ref_e_mean, 3),
                "participantRms": round(part_e_mean, 3)
            }
        else:
            flaw_type = "WEAK_EMPHASIS" if mean_dev > 0.6 else "ACOUSTIC_DEVIATION"
            metrics = {
                "combinedDeviation": round(mean_dev, 2),
                "mfccDeviation": round(mfcc_dev, 2),
                "pitchDeviation": round(p_dev, 2)
            }
            
        # Determine Severity
        if mean_dev >= 0.72:
            severity = "HIGH"
        elif mean_dev >= 0.58:
            severity = "MEDIUM"
        else:
            severity = "LOW"
            
        # Find intersecting transcript words
        snippet_words = []
        if words_alignment:
            for w in words_alignment:
                if (w["part_start"] <= part_t_end and w["part_end"] >= part_t_start):
                    snippet_words.append(w["word"])
        snippet = " ".join(snippet_words) if snippet_words else f"Segment from {part_t_start:.1f}s to {part_t_end:.1f}s"

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
