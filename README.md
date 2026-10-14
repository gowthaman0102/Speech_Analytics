# SpeechScope AI: Temporal Contrastive Speech Coach

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![faster-whisper](https://img.shields.io/badge/faster--whisper-1.2-FF6F00.svg)](https://github.com/SYSTRAN/faster-whisper)
[![librosa](https://img.shields.io/badge/librosa-1.0-2C5E8A.svg)](https://librosa.org)

> **Turn subjective speech judging into measurable, temporally grounded, and explainable contrastive coaching.**

---

## 1. Executive Summary

Competitive speech events (Interpretive Reading, Declamation, Extemporaneous Speaking, Persuasive Oratory, and Debate) evaluate both **speech content** and **speech delivery** (pacing, modulation, pause dynamics, energy contrast, fluency). Human judging in these competitions is notoriously subjective and often produces vague feedback such as *"Improve modulation"* or *"Your pacing is inconsistent."*

**SpeechScope AI** solves this by implementing a **Temporal Contrastive Speech Coaching Architecture**:
Instead of evaluating a recording in isolation, the participant's speech is aligned and compared against an ideal reference performance of the **exact same transcript**. The system temporally grounds delivery flaws to exact sub-second timestamps, explains why each flaw occurred using measurable acoustic signal differences (WPM, Hz, RMS dB), and computes deterministic, rubric-based scores across a 5-tier severity gradient.

---

## 2. Contrastive System Architecture

```text
Same Transcript
      │
      ├───────────────────────────┐
      │                           │
      ▼                           ▼
Ideal / Reference          Participant Speech
Speech Audio               Speech Audio
      │                           │
      ▼                           ▼
Acoustic Features          Acoustic Features
(F0, RMS, WPM, MFCC)       (F0, RMS, WPM, MFCC)
      │                           │
      └─────────────┬─────────────┘
                    ▼
       Lexical & DTW Temporal Alignment
                    ▼
        Contrastive Comparison Engine
                    ▼
         Feature Deviation Contours
                    ▼
      Sub-Second Temporal Flaw Regions
       (IoU Ground-Truth Validation)
                    ▼
          Rubric-Based Scores (0-100)
                    ▼
       Simple Coaching & Technical Rationale
```

---

## 3. 5-Tier Quality & Severity Gradient Matrix

Rather than testing a simple binary (Good vs Bad), SpeechScope AI evaluates delivery across a continuous 5-tier quality gradient:

| Tier | Designation | Cadence (Tempo) | Volume Level | Pause Dynamics | Pitch Dynamic | Target Rubric Score |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | **Ideal Standard** | 1.00x | Reference Baseline | Rhetorical (0.45s–0.8s) | Expressive | **95 – 100** |
| **Tier 2** | **Almost Perfect** | 1.05x | Baseline (0 dB) | Natural | Fluent | **80 – 92** |
| **Tier 3** | **Mildly Flawed** | 1.10x | -3 dB fade | Slight compression | Preserved | **75 – 84** |
| **Tier 4** | **Moderately Flawed** | 1.20x | -6 dB attenuation | 1.5s hesitation gap | Compressed | **65 – 74** |
| **Tier 5** | **Severely Flawed** | 1.40x | -10 dB faint projection | 2.8s dead air silence | Robotic Flat (Monotone) | **< 65** |

### Verified Monotonicity
The system guarantees **Strict Gradient Monotonicity** across all performance dimensions:
- **Speed**: $\text{Score}(1.05\text{x}) \ge \text{Score}(1.10\text{x}) \ge \text{Score}(1.20\text{x}) \ge \text{Score}(1.40\text{x})$
- **Volume**: $\text{Score}(-3\text{ dB}) \ge \text{Score}(-6\text{ dB}) \ge \text{Score}(-10\text{ dB})$
- **Pause**: $\text{Score}(1.5\text{s}) \ge \text{Score}(2.8\text{s})$

---

## 4. Key Delivery Flaw Detection & Causal Grounding

The engine classifies 4 primary delivery flaws with sub-second temporal intervals:

1. **Rushed Delivery / Compressed Pauses**:
   - *Acoustic Driver*: Speaking rate exceeds configured threshold ($> +25\%$ WPM delta) with rhetorical pauses compressed $< 0.15\text{s}$.
   - *Explanation*: "Speech rate accelerated by $+40\%$, compressing natural breathing points and reducing audience absorption."
2. **Low Projection / Volume Fade**:
   - *Acoustic Driver*: Vocal RMS energy drops $> 4.0\text{ dB}$ below reference standard.
   - *Explanation*: "Vocal power attenuated by $-7.6\text{ dB}$, producing soft delivery lacking competitive auditorium projection."
3. **Excessive Pause / Hesitation Dead Air**:
   - *Acoustic Driver*: Unplanned silence interval $\ge 0.8\text{s}$ (e.g. $1.5\text{s}$ or $2.8\text{s}$) where continuous delivery was expected.
   - *Explanation*: "$2.8$-second dead air gap detected, indicating memory hesitation or rhetorical breakdown."
4. **Monotone Intonation**:
   - *Acoustic Driver*: Normalized fundamental frequency variation (F0 Std Dev) drops $> 35\%$ below reference baseline.
   - *Explanation*: "Pitch spread restricted to $0.48\times$ baseline, creating a robotic cadence devoid of oratorical emphasis."

---

## 5. Technology Stack

### Backend
- **Python 3.11+ / 3.12**
- **FastAPI & Uvicorn**: High-performance REST web services.
- **SQLAlchemy & SQLite**: ACID relational storage for recordings, features, rubric scores, and flaw intervals.
- **faster-whisper**: CTranslate2-accelerated Whisper model with soundfile pre-decode for sub-second word alignment.
- **librosa, SciPy, NumPy, soundfile**: Digital signal processing, F0 estimation (pyin), RMS energy, and 13 MFCC coefficients.
- **fastdtw**: Dynamic Time Warping feature trajectory alignment.

### Frontend
- **React 19 & TypeScript**
- **Vite 8**: Sub-second Hot Module Replacement and production bundling.
- **Tailwind CSS v4**: Modern, dark-mode judicial coaching dashboard.
- **WaveSurfer.js**: Dual synchronized reference/participant waveform viewers with interactive flaw region jumping.
- **Recharts**: Aligned multi-feature curves (Pitch, RMS, WPM, and Deviations).
- **Lucide React**: Clean icons.

---

## 6. Installation & Quick Start

### Quickest Launch: One-Command Start (Windows)
Run the automated launcher script from PowerShell:
```powershell
.\run.ps1
```
Or double-click `start.bat`.

---

### Manual Setup (Step-by-Step)

#### Terminal 1: Backend Setup & Launch
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Linux/macOS)
# source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Build official 10-tier gradient demo dataset
python ../scripts/build_demo_dataset.py

# Launch FastAPI backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- Backend active at: `http://127.0.0.1:8000`
- Interactive Swagger API: `http://127.0.0.1:8000/docs`

#### Terminal 2: Frontend Setup & Launch
```bash
cd frontend

# Install packages
npm install --legacy-peer-deps

# Start Vite dev server
npm run dev
```
- Frontend active at: `http://127.0.0.1:5173`

---

## 7. Interactive Dashboard Features

1. **Reference-Relative Delivery Analysis Banner**: Transparently indicates contrastive evaluation mode.
2. **Bidirectional Linkage**:
   - Clicking a word in the transcript seeks audio, highlights the WaveSurfer playback, updates the feature curve window in Recharts, and focuses the corresponding Flaw Card.
3. **Flaw Cards with "Why was this flagged?"**:
   - Discloses exact mathematical formulation, measured participant value vs reference baseline, and active threshold comparison.
   - Toggle between **Simple Coaching Feedback** (for speakers) and **Technical Analysis (Judge Mode)**.
4. **Audit Configuration Panel**:
   - Inspects active detection thresholds (Pace $\pm 25\%$, Pitch $-35\%$, Pause $0.40\text{s}$, Energy $4.0\text{ dB}$, Min Duration $0.40\text{s}$) and rubric weights.
5. **Expected vs Detected Ground Truth Table**:
   - Shows Temporal Intersection-over-Union (IoU), Start/End timing errors, and detection status badges.
6. **Dataset Explorer & Benchmark Matrix**:
   - Displays the 5-tier gradient matrix, a one-click **"Run Gradient Benchmark"** button verifying monotonicity, and one-click **"Evaluate in Dashboard"** on any of the 10 variants.

---

## 8. Verification & Acceptance Tests

Run the complete contrastive gradient acceptance test suite:
```bash
backend\venv\Scripts\python.exe scripts/test_gradient_acceptance.py
```

### Verified Test Suite Results (100% PASS):
- **Test 1 (Identical Audio Comparison)**:
  - Reference vs Reference: Score **99.0 / 100**, Similarity **99.0%**, **0** severe flaws. `[PASS]`
- **Test 2 (Almost Perfect Delivery 1.05x)**:
  - Score **80.2 / 100**, **0** high-severity flaws. `[PASS]`
- **Test 3 (Gradient Monotonicity Across All 10 Tiers)**:
  - Speed: $80.2 \ge 75.5 \ge 69.9 \ge 62.7$
  - Volume: $86.2 \ge 81.8 \ge 69.0$
  - Pause: $94.9 \ge 86.6$
  - `Monotonicity: True`. `[PASS]`
- **Test 4 (Sub-Second Temporal Grounding & IoU)**:
  - Ground truth: $15.5\text{s} - 17.0\text{s}$, Detected: $15.5\text{s} - 17.0\text{s}$, Temporal $\text{IoU} = 1.0$. `[PASS]`
- **Test 5 (Deterministic Reproducibility)**:
  - Repeated evaluation runs return identical scores ($\Delta = 0.0$). `[PASS]`

---

## 9. REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | System health check (`{"status": "ok"}`) |
| `/api/evaluations/demo` | `POST` | Triggers the official pre-packaged demo evaluation |
| `/api/evaluations/variant/{index}` | `POST` | Evaluates a specific gradient variant against reference audio |
| `/api/evaluations` | `POST` | Uploads reference, participant audio and transcript |
| `/api/evaluations/{id}` | `GET` | Returns status and high-level evaluation progress |
| `/api/evaluations/{id}/results` | `GET` | Returns full evaluation summary, rubric, flaws, and validation |
| `/api/evaluations/{id}/features` | `GET` | Returns time-series curves (Pitch, RMS, WPM, Deviations) |
| `/api/evaluations/{id}/flaws` | `GET` | Returns detected flaw segments with causal explanations |
| `/api/recordings/{id}/audio` | `GET` | Streams WAV audio for WaveSurfer playback |
| `/api/dataset` | `GET` | Returns speech corpus and 10 gradient variants |
| `/api/dataset/benchmark` | `GET`/`POST` | Executes and returns comprehensive 10-tier gradient benchmark |

---

## 10. License

MIT License. Developed for competitive speech evaluation and temporal flaw finding.
