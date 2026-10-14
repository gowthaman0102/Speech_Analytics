# SpeechScope AI: Counterpointing Speech Analytics & Temporal Flaw Finding

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![faster-whisper](https://img.shields.io/badge/faster--whisper-1.2-FF6F00.svg)](https://github.com/SYSTRAN/faster-whisper)
[![librosa](https://img.shields.io/badge/librosa-1.0-2C5E8A.svg)](https://librosa.org)

> **Turn subjective speech judging into measurable, timestamped, and explainable feedback using contrastive acoustic analytics.**

---

## 1. Executive Summary

Competitive speech events (Interpretive Reading, Declamation, Extemporaneous Speaking, Persuasive Oratory, and Debate) evaluate both **speech content** and **speech delivery** (pacing, modulation, pause dynamics, energy contrast, fluency). Human judging in these competitions is notoriously subjective and often produces vague feedback such as *"Improve modulation"* or *"Your pacing is inconsistent."*

**SpeechScope AI** solves this by implementing a **contrastive evaluation architecture**:
Instead of evaluating a recording in isolation, the participant's speech is aligned and compared against an ideal reference performance of the **exact same transcript**. The system temporally grounds delivery flaws to exact sub-second timestamps, explains why each flaw occurred using measurable acoustic signal differences (WPM, Hz, RMS dB), and computes deterministic, rubric-based scores.

---

## 2. System Architecture

```text
Ideal Speech Audio          Exact Transcript           Participant Speech Audio
       │                            │                             │
       ▼                            │                             ▼
┌──────────────────────┐            │             ┌──────────────────────┐
│  Audio Preprocess    │            │             │  Audio Preprocess    │
│  (16kHz, Mono, PCM)  │            │             │  (16kHz, Mono, PCM)  │
└──────────┬───────────┘            │             └──────────┬───────────┘
           ▼                        │                        ▼
┌───────────────────────────────────┴────────────────────────────────────┐
│                  faster-whisper Word/Sentence Alignment                │
│                 Sub-second Lexical Timestamp Extraction                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Signal Feature Engine                           │
│   • Pitch / Fundamental Frequency (F0, librosa.pyin / autocorrelation) │
│   • Vocal Energy (RMS frame power & dynamic contrast)                  │
│   • 13 MFCC Coefficients (Timbral envelope distance)                   │
│   • Spectral Dynamics (Centroid, Bandwidth, Zero Crossing Rate)        │
│   • Speech Rate Cadence (Words Per Minute time series)                 │
│   • Silence / Pause Extraction (Rhetorical vs Hesitation pauses)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             Per-Speaker Z-Score Normalization: z = (x - μ) / σ         │
│          Dynamic Time Warping (DTW) & Anchor Synchronization           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Contrastive Analysis Engine                       │
│    D(t) = Wp·ΔPitch + We·ΔEnergy + Wr·ΔRate + Wpause·ΔPause + Wm·ΔMFCC │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Temporal Flaw Classification                      │
│   [RUSHED_DELIVERY, SLOW_DELIVERY, MONOTONE, LOW_VOLUME, PAUSE_FLAWS]  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌─────────────────────────┬──────────────────────────┬───────────────────┐
│     Scoring Engine      │   Explanation Engine     │ SQLite Persistence│
│ Deterministic 0-100 pts │ Measurable Evidence & Rec│ Relational Store  │
└─────────────────────────┴──────────────────────────┴───────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Interactive React Dashboard (Vite)                   │
│ WaveSurfer Waveforms • Recharts Curves • Timeline • Grounded Transcript│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Backend
- **Python 3.11+ / 3.12**
- **FastAPI**: Asynchronous high-performance REST API.
- **Uvicorn**: ASGI web server.
- **SQLAlchemy & SQLite**: ACID relational data persistence.
- **faster-whisper**: CTranslate2-based Whisper model for sub-second word timestamps.
- **librosa, SciPy, NumPy, soundfile, pydub**: Digital signal processing, F0 estimation, RMS energy, MFCC, and spectral features.
- **fastdtw**: Dynamic Time Warping feature trajectory alignment.

### Frontend
- **React 19 & TypeScript**
- **Vite 8**: Rapid development and optimized production bundling.
- **Tailwind CSS v4**: Sleek, modern dark-mode judicial dashboard.
- **WaveSurfer.js**: Dual interactive waveform visualization with seek-to-flaw synchronization.
- **Recharts**: Time-series acoustic overlays (Pitch, RMS, WPM, and Deviations).
- **Lucide React**: Clean iconography.

---

## 4. Key Algorithms & Mathematical Formulation

### A. Per-Speaker Normalization
Speakers inherently have different vocal ranges and baseline volumes. To ensure fair, speaker-independent evaluation, all continuous acoustic contours are normalized per speaker:
$$\mu = \frac{1}{N} \sum_{i=1}^N x_i, \quad \sigma = \sqrt{\frac{1}{N} \sum_{i=1}^N (x_i - \mu)^2}$$
$$z_i = \frac{x_i - \mu}{\sigma}$$

### B. Dynamic Time Warping (DTW)
Acoustic feature vectors $\mathbf{v}_r = [z_{\text{pitch}}, z_{\text{rms}}, \mathbf{m}_{1..4}]$ and $\mathbf{v}_p$ are aligned to solve non-linear temporal expansion and compression between speakers, mapping reference frames $t_r$ to participant frames $t_p$.

### C. Multi-Feature Temporal Deviation Score
At each time step $t$, the composite deviation $D(t)$ is computed using configurable weights:
$$D(t) = W_p \cdot \Delta_{\text{pitch}}(t) + W_e \cdot \Delta_{\text{energy}}(t) + W_r \cdot \Delta_{\text{rate}}(t) + W_{\text{pause}} \cdot \Delta_{\text{pause}}(t) + W_m \cdot \Delta_{\text{mfcc}}(t)$$
*Default Weights:* Pitch ($0.25$), Energy ($0.15$), Rate ($0.25$), Pause ($0.20$), MFCC ($0.15$).

### D. Deterministic Rubric Scoring (100 Points Total)
Scoring is calculated deterministically from signal deviations:
$$\text{Score}_{\text{dimension}} = \max\left(20, \min\left(100, 100 \times (1 - \text{Error}_{\text{dimension}})\right)\right)$$
$$\text{Overall Score} = 0.20 \cdot \text{Pace} + 0.20 \cdot \text{Pitch} + 0.15 \cdot \text{Pause} + 0.15 \cdot \text{Energy} + 0.15 \cdot \text{Clarity} + 0.15 \cdot \text{Delivery}$$

---

## 5. Prerequisites & Requirements

1. **Python 3.11+ or 3.12** installed and on system PATH.
2. **Node.js v18+ or v20+** and **npm** installed.
3. **FFmpeg**: Automatically auto-detected from system PATH, WinGet directories, or Python's bundled `imageio-ffmpeg`.

---

## 6. Installation & Quick Start

### Quickest Launch: One-Command Start (Windows)
Run the automated launcher script from PowerShell:
```powershell
.\run.ps1
```
Or double click `start.bat`.

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

# Build official demo dataset audio and ground-truth labels
python ../scripts/build_demo_dataset.py

# Launch FastAPI backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend will be active at `http://127.0.0.1:8000`.
Interactive Swagger API documentation: `http://127.0.0.1:8000/docs`.

#### Terminal 2: Frontend Setup & Launch
```bash
cd frontend

# Install packages
npm install --legacy-peer-deps

# Start Vite dev server
npm run dev
```

Frontend will be active at `http://127.0.0.1:5173`.

---

## 7. Demo Workflow & Jury Presentation Scenario

SpeechScope AI includes a built-in prepackaged demo dataset designed for live demonstrations:

1. **Open Dashboard**: Navigate to `http://127.0.0.1:5173`.
2. **Launch Demo**: Click **"Try Demo Evaluation"** on the landing page or navbar.
3. **Automated Analysis**: The pipeline automatically processes the reference audio (`demo_reference.wav`) and flawed participant audio (`demo_participant.wav`), running:
   - Audio preprocessing & peak normalization
   - Speech-to-text token alignment
   - Time-series feature extraction (F0, RMS, WPM, Pauses)
   - Dynamic Time Warping alignment
   - Temporal flaw detection & causal classification
   - Deterministic rubric scoring
4. **Inspect Master Results**:
   - **Overall Score**: ~63 / 100 with radial color gauge.
   - **Reference Similarity**: 73.3%.
   - **Evaluation Confidence**: 92.8%.
5. **Interactive Waveform Scrubbing**:
   - Click the **`MISSING_PAUSE`** region (`04.25s - 05.50s`): the waveform seeks to that exact phrase (`"Today we must confront the"`).
   - Click the **`LOW_VOLUME`** region (`06.50s - 09.00s`): listen to the participant's fading projection (-7.6 dB).
   - Click the **`SLOW_DELIVERY`** hesitation gap (`15.25s - 19.50s`): listen to the 2.8-second hesitation.
6. **Toggle Judge Mode**: Click **"Technical / Judge Mode"** on the flaw card to view exact mathematical metrics (Reference WPM vs Participant WPM, dB delta, Hz variation ratio).
7. **Dataset Explorer**: Navigate to `/dataset` to view the synthetic flaw matrix across the severity gradient (Fast 1.35x, Slow 0.75x, Low Volume -10dB, Excessive Pause, Monotone, and Near-Perfect 1.04x).

---

## 8. REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | System health check (`{"status": "ok"}`) |
| `/api/evaluations/demo` | `POST` | Triggers the official pre-packaged demo evaluation |
| `/api/evaluations` | `POST` | Uploads reference, participant audio and transcript |
| `/api/evaluations/{id}` | `GET` | Returns status and high-level evaluation progress |
| `/api/evaluations/{id}/results` | `GET` | Returns full evaluation summary, rubric, and flaws |
| `/api/evaluations/{id}/features` | `GET` | Returns time-series curves (Pitch, RMS, WPM, Deviations) |
| `/api/evaluations/{id}/flaws` | `GET` | Returns detected flaw segments with causal explanations |
| `/api/recordings/{id}/audio` | `GET` | Streams WAV audio for WaveSurfer playback |
| `/api/dataset` | `GET` | Returns speech corpus and synthetic flaw variants |

---

## 9. Verification & Acceptance Tests

Run the deterministic verification test suite:
```bash
python scripts/test_acceptance.py
```

### Verified Test Results:
- **Test 1 (Identical Audio)**:
  - Baseline vs Baseline: Overall Score **99.1 / 100**, Similarity **99.1%**, **0** flaws detected. `[PASS]`
- **Test 5 (Reproducibility)**:
  - Repeated analysis of the same audio returns identical scores ($\Delta = 0.0$). `[PASS]`
- **Flaw Grounding**:
  - Accelerated pace (+40%) correctly triggers `RUSHED_DELIVERY` / `MISSING_PAUSE`.
  - Attenuation (-8 dB) correctly triggers `LOW_VOLUME`.
  - Mid-speech silence (2.8s) correctly triggers `EXCESSIVE_PAUSE` / hesitation.
  - Flattened pitch dynamics correctly triggers `MONOTONE` intonation.

---

## 10. Future ML Architecture

While the prototype uses deterministic digital signal processing and DTW to guarantee explainability and zero cloud costs, the system is designed to seamlessly integrate a learned contrastive encoder:
- **Architecture**: Dual-branch Siamese / Triplet Speech Encoder (Wav2Vec 2.0 / Conformer backbone).
- **Contrastive Triplet Loss**:
  $$\mathcal{L} = \max\left(d(\text{Anchor}, \text{NearPerfect}) - d(\text{Anchor}, \text{Flawed}) + m, 0\right)$$
- **Zero-Shot Transfer**: Cross-lingual delivery scoring and fine-grained articulatory phoneme scoring.

---

## 11. License

MIT License. Developed for competitive speech evaluation and temporal flaw finding.
