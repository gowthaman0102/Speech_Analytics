# SpeechScope: Automated Semantic-Aware Speech Coach & Temporal Flaw Finder

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![faster-whisper](https://img.shields.io/badge/faster--whisper-1.2-FF6F00.svg)](https://github.com/SYSTRAN/faster-whisper)
[![sentence-transformers](https://img.shields.io/badge/sentence--transformers-all--MiniLM--L6--v2-blue.svg)](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
[![librosa](https://img.shields.io/badge/librosa-1.0-2C5E8A.svg)](https://librosa.org)

> **Automated speech delivery analysis and temporal flaw finding without requiring reference audio or transcripts.**

---

## 1. Executive Summary

Competitive speech events (Interpretive Reading, Declamation, Extemporaneous Speaking, Persuasive Oratory, and Debate) evaluate both **speech content** and **speech delivery** (pacing, modulation, pause dynamics, energy contrast, fluency). Human judging in these competitions is notoriously subjective and often produces vague feedback such as *"Improve modulation"* or *"Your pacing is inconsistent."*

**SpeechScope** provides an **Automated Semantic-Aware Delivery Evaluation Pipeline**:
- **Zero Reference Audio or Transcript Required**: Users upload only their **Participant Audio** (`.wav`, `.mp3`, `.m4a`, `.flac`) or **Participant Video** (`.mp4`, `.mov`, `.mkv`, `.webm`).
- **Automated ASR & Segmentation**: `faster-whisper` automatically transcribes speech and extracts word boundaries, pause durations, and sentence segments.
- **Semantic Intent Classification**: Embeddings from `sentence-transformers/all-MiniLM-L6-v2` classify communicative intent (e.g., inquiry, persuasive claim, emotional contrast, call-to-action) and rhetorical sentence roles.
- **Expected Delivery Profile**: Dynamically calculates recommended prosodic ranges (tempo, pitch variation, energy, intonation) appropriate for the semantic content.
- **Temporal Flaw Grounding**: Pinpoints vocal delivery flaws to exact sub-second timestamps, explains the acoustic cause (WPM, Hz, RMS dB), and computes deterministic 6-dimension rubric scores.
- **Dual Comparison Mode Preserved**: Also supports contrastive reference-audio comparison when reference baselines are available.

The application features a **human-crafted analyst design system** (warm paper `#F7F6F3` background, crisp surfaces, editorial serif typography for speech transcripts, interactive sentence analyzer, and color-blind safe data series).

---

## 2. System Architecture

### Mode A: Automated Semantic-Aware Delivery Pipeline (Default)
`	ext
                  Participant Audio / Video
                              │
                              ▼
                Media Ingestion & Audio Normalization
                    (16kHz Mono PCM WAV via FFmpeg)
                              │
                              ▼
                    Automated Whisper ASR
               (Word Timestamps & Transcript)
                              │
                              ▼
                Sentence Segmentation & Rhetorical Pauses
                              │
                              ▼
                Semantic & Intent Classification
             (sentence-transformers all-MiniLM-L6-v2)
                              │
                              ▼
                Expected Delivery Profile Engine
             (Target Prosodic Ranges for Each Intent)
                              │
                              ▼
                Actual Acoustic Feature Extraction
                    (F0, RMS, WPM, Z-Scores)
                              │
                              ▼
                 Semantic-Prosody Deviation Matrix
                              │
                              ▼
                Sub-Second Temporal Flaws & 6-Rubric Scores
                              │
                              ▼
                Explainable Diagnostics & Interactive UI
`

### Mode B: Dual-Recording Contrastive Alignment (When Reference Audio is Provided)
`	ext
    Reference Speech Audio               Participant Speech Audio
              │                                      │
              ▼                                      ▼
    Acoustic Features (F0, RMS, WPM)       Acoustic Features (F0, RMS, WPM)
              │                                      │
              └──────────────────┬───────────────────┘
                                 ▼
                     Dynamic Time Warping (DTW)
                                 ▼
                      Contrastive Delta Contours
                                 ▼
                     Temporal Flaw Discrepancies
`

---

## 3. 5-Tier Quality & Severity Gradient Matrix

Rather than testing a simple binary (Good vs Bad), SpeechScope evaluates delivery across a continuous 5-tier quality gradient:

| Tier | Designation | Cadence (Tempo) | Volume Level | Pause Dynamics | Pitch Dynamic | Target Rubric Score |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | **Ideal Standard** | 1.00x | Reference Baseline | Rhetorical (0.45s–0.8s) | Expressive | **95 – 100** |
| **Tier 2** | **Almost Perfect** | 1.05x | Baseline (0 dB) | Natural | Fluent | **80 – 92** |
| **Tier 3** | **Mildly Flawed** | 1.10x | -3 dB fade | Slight compression | Preserved | **75 – 84** |
| **Tier 4** | **Moderately Flawed** | 1.20x | -6 dB attenuation | 1.5s hesitation gap | Compressed | **65 – 74** |
| **Tier 5** | **Severely Flawed** | 1.40x | -10 dB faint projection | 2.8s dead air silence | Flat (Monotone) | **< 65** |

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
   - *Coaching*: "Speech rate accelerated by $+40\%$, compressing natural breathing points and reducing audience absorption."
2. **Low Projection / Volume Fade**:
   - *Acoustic Driver*: Vocal RMS energy drops $> 4.0\text{ dB}$ below reference standard.
   - *Coaching*: "Vocal power attenuated by $-7.6\text{ dB}$, producing soft delivery lacking competitive auditorium projection."
3. **Excessive Pause / Hesitation Dead Air**:
   - *Acoustic Driver*: Unplanned silence interval $\ge 0.8\text{s}$ (e.g. $1.5\text{s}$ or $2.8\text{s}$) where continuous delivery was expected.
   - *Coaching*: "$2.8$-second dead air gap detected, indicating memory hesitation or rhetorical breakdown."
4. **Monotone Intonation**:
   - *Acoustic Driver*: Normalized fundamental frequency variation (F0 Std Dev) drops $> 35\%$ below reference baseline.
   - *Coaching*: "Pitch spread restricted to $0.48\times$ baseline, creating a robotic cadence devoid of oratorical emphasis."

---

## 5. Technology Stack

### Backend
- **Python 3.11+ / 3.12**
- **FastAPI & Uvicorn**: High-performance REST web services.
- **SQLAlchemy & SQLite**: ACID relational storage with background pipeline execution.
- **faster-whisper**: CTranslate2-accelerated Whisper model with soundfile pre-decode for sub-second word alignment.
- **librosa, SciPy, NumPy, soundfile**: Digital signal processing, F0 estimation (pyin), RMS energy, and 13 MFCC coefficients.
- **fastdtw**: Dynamic Time Warping feature trajectory alignment.

### Frontend
- **React 19 & TypeScript**: Component-driven SPA architecture.
- **Vite 8**: Production bundling with dynamic route-based code-splitting.
- **Tailwind CSS v4**: Modern CSS-first engine using semantic design tokens.
- **Typography**: Self-hosted `@fontsource-variable/inter` and `@fontsource-variable/source-serif-4`.
- **WaveSurfer.js v8**: Dual synchronized reference/participant waveforms with sub-second flaw overlays and RFC 7233 byte-range streaming.
- **Recharts**: Aligned multi-feature curves (Pitch, RMS, WPM, and Deviations).
- **Lucide React**: Clean vector iconography.

---

## 6. Installation & Quick Start

### Quickest Launch: Automated Scripts (Windows)
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

## 7. Interactive Dashboard Pages

1. **Landing Page (`/`)**: Clean editorial introduction, architecture preview, 3-step workflow, and instant launch actions.
2. **New Evaluation (`/evaluate`)**: Single-column 720px form, drag-and-drop audio dropzones with live preview players, word-counting transcript editor, and sample data loader.
3. **Processing Page (`/processing/:id`)**: Real progress tracking (0–100%), pipeline stage stepper, elapsed duration timer, and background execution link.
4. **Results Page (`/results/:id`)**:
   - SVG circular score gauge and 3 analytical pillars.
   - Dual stacked WaveSurfer player with Lock Playheads toggle and Spacebar keyboard shortcut.
   - Two-pane flaw inspector with severity filters and actionable coaching recommendations.
   - Recharts acoustic trajectory curves for Pitch, Energy, Cadence, and Composite Deviations.
   - 6-dimension deterministic rubric card with weights.
   - Grounded transcript in serif typography with click-to-seek audio jumping.
5. **Dataset Explorer (`/dataset`)**: 5-tier gradient matrix, monotonicity benchmark runner, and variant evaluation buttons.
6. **Evaluations History (`/evaluations`)**: Archive table with status badges, score pill, flaw counts, and evaluation deletion.

---

## 8. Verification & Acceptance Tests

### 1. Automated Semantic Pipeline Test (Single Media Upload)
ash
backend/venv/Scripts/python.exe scripts/test_automated_semantic.py

### 2. Contrastive Gradient Acceptance Test Suite (Dual-Reference Mode)
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

### Run Unit Tests
```bash
# Frontend tests (Vitest)
cd frontend
npm test

# Backend tests (Pytest)
cd ..
backend\venv\Scripts\python.exe -m pytest backend/tests/test_api.py -v
```

---

## 9. REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | System health check (`{"status": "ok", "app": "SpeechScope"}`) |
| `/api/evaluations` | `GET` | Retrieves paginated history of past evaluations |
| `/api/evaluations` | `POST` | Uploads reference and participant audio with transcript |
| `/api/evaluations/{id}` | `DELETE` | Deletes an evaluation and associated records |
| `/api/evaluations/demo` | `POST` | Triggers the official pre-packaged demo evaluation |
| `/api/evaluations/dataset` | `POST` | Evaluates a specific gradient variant against reference audio |
| `/api/evaluations/{id}` | `GET` | Returns status, progress, and active pipeline stage |
| `/api/evaluations/{id}/results` | `GET` | Returns full evaluation summary, rubric, flaws, and validation |
| `/api/evaluations/{id}/features` | `GET` | Returns time-series curves (Pitch, RMS, WPM, Deviations) |
| `/api/evaluations/{id}/flaws` | `GET` | Returns detected flaw segments with causal explanations |
| `/api/recordings/{id}/audio` | `GET` | Streams audio with RFC 7233 HTTP 206 Range request support |
| `/api/dataset` | `GET` | Returns speech corpus and 10 gradient variants |
| `/api/dataset/benchmark` | `GET` | Executes and returns comprehensive 10-tier gradient benchmark |

---

## 10. Documentation
- [Design System & Architecture (`docs/DESIGN.md`)](docs/DESIGN.md)
- [Changelog & Redesign Details (`docs/CHANGELOG.md`)](docs/CHANGELOG.md)

---

## 11. License

MIT License. Developed for competitive speech evaluation and temporal flaw finding.
