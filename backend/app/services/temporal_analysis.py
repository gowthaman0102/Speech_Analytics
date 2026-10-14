import numpy as np
from typing import Dict, Any, List, Tuple
from ..config import settings

def perform_dtw_alignment(ref_features: Dict[str, Any], part_features: Dict[str, Any], anchors: List[Tuple[float, float]] = None) -> Dict[str, Any]:
    """
    Aligns reference and participant feature sequences using DTW with fallback to anchor interpolation.
    Computes frame-by-frame aligned feature pairs and multi-dimensional deviations.
    """
    ref_times = np.array(ref_features["time_points"])
    part_times = np.array(part_features["time_points"])
    
    n_ref = len(ref_times)
    n_part = len(part_times)
    
    # Feature vectors for DTW: combine pitch_z, rms_z, and first 4 MFCCs
    ref_pitch = np.array(ref_features["pitch_z"])
    part_pitch = np.array(part_features["pitch_z"])
    ref_rms = np.array(ref_features["rms_z"])
    part_rms = np.array(part_features["rms_z"])
    
    ref_mfcc = np.array(ref_features["mfcc"])[:4, :] # (4, n_ref)
    part_mfcc = np.array(part_features["mfcc"])[:4, :] # (4, n_part)
    
    # Stack normalized features for distance
    ref_vec = np.vstack([ref_pitch, ref_rms, ref_mfcc]).T # (n_ref, 6)
    part_vec = np.vstack([part_pitch, part_rms, part_mfcc]).T # (n_part, 6)

    warp_path = None
    try:
        from fastdtw import fastdtw
        from scipy.spatial.distance import euclidean
        distance, path = fastdtw(ref_vec, part_vec, dist=euclidean)
        warp_path = path
    except Exception:
        warp_path = None

    # Mapping from ref_idx to part_idx
    ref_to_part_map = {}
    if warp_path:
        for r_idx, p_idx in warp_path:
            if r_idx not in ref_to_part_map:
                ref_to_part_map[r_idx] = []
            ref_to_part_map[r_idx].append(p_idx)
        # For each ref index, average the corresponding participant indices
        part_mapped_indices = [int(round(np.mean(ref_to_part_map.get(i, [min(n_part - 1, int(i * n_part / max(1, n_ref)))])))) for i in range(n_ref)]
    else:
        # Fallback: Piecewise linear mapping using alignment anchors or linear interpolation
        if anchors and len(anchors) >= 2:
            anchor_ref_t = [a[0] for a in anchors]
            anchor_part_t = [a[1] for a in anchors]
            # Interpolate participant time for each ref time
            mapped_part_times = np.interp(ref_times, anchor_ref_t, anchor_part_t)
            part_mapped_indices = [int(np.clip(round(t / 0.25), 0, n_part - 1)) for t in mapped_part_times]
        else:
            part_mapped_indices = [int(np.clip(round(i * (n_part - 1) / max(1, n_ref - 1)), 0, n_part - 1)) for i in range(n_ref)]

    # Compute aligned feature series and per-frame deviations
    aligned_ref_pitch = []
    aligned_part_pitch = []
    aligned_ref_rms = []
    aligned_part_rms = []
    aligned_ref_wpm = []
    aligned_part_wpm = []
    
    pitch_deviations = []
    energy_deviations = []
    rate_deviations = []
    pause_deviations = []
    mfcc_deviations = []
    combined_deviations = []

    # Pause lookup helper
    def is_in_pause(t: float, pauses: List[Dict[str, Any]]) -> bool:
        return any(p["start"] <= t <= p["end"] for p in pauses)

    ref_mfcc_full = np.array(ref_features["mfcc"]) # (13, n_ref)
    part_mfcc_full = np.array(part_features["mfcc"]) # (13, n_part)

    for r_idx in range(n_ref):
        p_idx = part_mapped_indices[r_idx]
        t_ref = ref_times[r_idx]
        t_part = part_times[p_idx]

        r_p_raw = ref_features["pitch"][r_idx]
        p_p_raw = part_features["pitch"][p_idx]
        aligned_ref_pitch.append(float(r_p_raw))
        aligned_part_pitch.append(float(p_p_raw))

        r_e_raw = ref_features["rms"][r_idx]
        p_e_raw = part_features["rms"][p_idx]
        aligned_ref_rms.append(float(r_e_raw))
        aligned_part_rms.append(float(p_e_raw))

        r_wpm = ref_features["wpm_series"][r_idx]
        p_wpm = part_features["wpm_series"][p_idx]
        aligned_ref_wpm.append(float(r_wpm))
        aligned_part_wpm.append(float(p_wpm))

        # 1. Pitch deviation (z-score difference, bounded)
        # Only heavily penalize when voiced in both or voiced in reference
        r_pz = ref_features["pitch_z"][r_idx]
        p_pz = part_features["pitch_z"][p_idx]
        if r_p_raw > 0 and p_p_raw > 0:
            dev_p = min(2.5, abs(r_pz - p_pz)) / 2.5
        elif r_p_raw > 0 and p_p_raw == 0:
            dev_p = 0.6  # Participant dropped voicing
        else:
            dev_p = 0.1  # Unvoiced region
        pitch_deviations.append(float(dev_p))

        # 2. Energy deviation (z-score difference, bounded)
        r_ez = ref_features["rms_z"][r_idx]
        p_ez = part_features["rms_z"][p_idx]
        dev_e = min(2.5, abs(r_ez - p_ez)) / 2.5
        energy_deviations.append(float(dev_e))

        # 3. Speech rate deviation
        dev_r = min(1.0, abs(r_wpm - p_wpm) / max(60.0, r_wpm))
        rate_deviations.append(float(dev_r))

        # 4. Pause deviation
        ref_silent = is_in_pause(t_ref, ref_features["pauses"])
        part_silent = is_in_pause(t_part, part_features["pauses"])
        if ref_silent != part_silent:
            dev_pause = 0.85
        elif ref_silent and part_silent:
            dev_pause = 0.05
        else:
            dev_pause = 0.0
        pause_deviations.append(float(dev_pause))

        # 5. MFCC Euclidean distance (normalized)
        r_m = ref_mfcc_full[:, r_idx]
        p_m = part_mfcc_full[:, p_idx]
        dist_m = float(np.linalg.norm(r_m - p_m))
        dev_mfcc = min(1.0, dist_m / 60.0)
        mfcc_deviations.append(float(dev_mfcc))

        # Combined weighted deviation D
        d_comb = (
            settings.WEIGHT_PITCH * dev_p +
            settings.WEIGHT_ENERGY * dev_e +
            settings.WEIGHT_RATE * dev_r +
            settings.WEIGHT_PAUSE * dev_pause +
            settings.WEIGHT_MFCC * dev_mfcc
        )
        combined_deviations.append(float(np.clip(d_comb, 0.0, 1.0)))

    # Temporal smoothing of combined deviations (rolling mean over 3 frames)
    smooth_dev = np.convolve(combined_deviations, np.ones(3)/3.0, mode="same").tolist()

    return {
        "time_points": ref_times.tolist(),
        "part_mapped_times": [float(part_times[p]) for p in part_mapped_indices],
        "aligned_features": {
            "ref_pitch": aligned_ref_pitch,
            "part_pitch": aligned_part_pitch,
            "ref_rms": aligned_ref_rms,
            "part_rms": aligned_part_rms,
            "ref_wpm": aligned_ref_wpm,
            "part_wpm": aligned_part_wpm,
        },
        "deviations": {
            "pitch": pitch_deviations,
            "energy": energy_deviations,
            "rate": rate_deviations,
            "pause": pause_deviations,
            "mfcc": mfcc_deviations,
            "combined": smooth_dev
        }
    }
