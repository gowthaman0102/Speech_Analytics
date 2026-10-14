from typing import List, Dict, Any

def calculate_temporal_iou(start1: float, end1: float, start2: float, end2: float) -> float:
    """Calculates temporal Intersection-over-Union (IoU) between two time intervals."""
    intersection_start = max(start1, start2)
    intersection_end = min(end1, end2)
    intersection = max(0.0, intersection_end - intersection_start)
    
    union_start = min(start1, start2)
    union_end = max(end1, end2)
    union = max(1e-6, union_end - union_start)
    
    return round(float(intersection / union), 2)

def validate_flaws_against_ground_truth(
    detected_flaws: List[Dict[str, Any]], 
    expected_flaws: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Validates detected flaws against expected ground-truth annotations.
    Calculates Type Match, Temporal IoU, Start/End timing errors, and detection rate.
    """
    matched_results = []
    detected_used = set()

    for exp in expected_flaws:
        exp_type = exp.get("type")
        exp_start = exp.get("start", 0.0)
        exp_end = exp.get("end", 0.0)
        exp_sev = exp.get("severity", "MEDIUM")

        best_match = None
        best_iou = 0.0
        best_det_idx = -1

        for idx, det in enumerate(detected_flaws):
            det_start = det["start"]
            det_end = det["end"]
            iou = calculate_temporal_iou(exp_start, exp_end, det_start, det_end)
            if iou > best_iou:
                best_iou = iou
                best_match = det
                best_det_idx = idx

        if best_match and best_iou >= 0.15:
            detected_used.add(best_det_idx)
            type_matched = (best_match["type"] == exp_type)
            start_err = round(abs(best_match["start"] - exp_start), 2)
            end_err = round(abs(best_match["end"] - exp_end), 2)
            
            matched_results.append({
                "expectedType": exp_type,
                "detectedType": best_match["type"],
                "typeMatched": type_matched,
                "expectedInterval": f"{exp_start:.1f}s - {exp_end:.1f}s",
                "detectedInterval": f"{best_match['start']:.1f}s - {best_match['end']:.1f}s",
                "temporalIoU": best_iou,
                "startTimeErrorSec": start_err,
                "endTimeErrorSec": end_err,
                "status": "DETECTED",
                "expectedSeverity": exp_sev,
                "detectedSeverity": best_match["severity"]
            })
        else:
            matched_results.append({
                "expectedType": exp_type,
                "detectedType": "None",
                "typeMatched": False,
                "expectedInterval": f"{exp_start:.1f}s - {exp_end:.1f}s",
                "detectedInterval": "None",
                "temporalIoU": 0.0,
                "startTimeErrorSec": 0.0,
                "endTimeErrorSec": 0.0,
                "status": "MISSED",
                "expectedSeverity": exp_sev,
                "detectedSeverity": "None"
            })

    total_expected = len(expected_flaws)
    detected_count = sum(1 for m in matched_results if m["status"] == "DETECTED")
    type_matches_count = sum(1 for m in matched_results if m["typeMatched"])
    ious = [m["temporalIoU"] for m in matched_results if m["temporalIoU"] > 0]
    avg_iou = round(float(sum(ious) / max(1, len(ious))), 2)

    return {
        "totalExpected": total_expected,
        "detectedCount": detected_count,
        "detectionRatePct": round((detected_count / max(1, total_expected)) * 100.0, 1),
        "typeMatchRatePct": round((type_matches_count / max(1, total_expected)) * 100.0, 1),
        "averageTemporalIoU": avg_iou,
        "validationDetails": matched_results
    }
