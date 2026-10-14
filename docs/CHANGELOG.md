# Changelog: SpeechScope Redesign & Stabilization

## [2.0.0] - 2026-10-14

### Complete Visual Redesign ("Human-Crafted Analyst" Aesthetic)
- **Design Token System**:
  - Replaced dark navy backgrounds (`slate-950`) and neon glowing blobs (`cyan-400`, `indigo-500`) with a calm, high-contrast light theme:
    - Background: `--bg: #F7F6F3` (Warm paper)
    - Card Surfaces: `--surface: #FFFFFF`, `--surface-2: #F1EFEA`
    - Structural Borders: `--border: #E3E0D8`, `--border-strong: #CFCBC0`
    - High-Contrast Text: `--text: #1C1B19`, `--text-muted: #5E5B54`
    - Primary Reference Series: `--series-ref: #1F4E79` (Deep teal-blue)
    - Secondary Participant Series: `--series-participant: #C2571A` (Warm terracotta)
- **Self-Hosted Variable Fonts**:
  - Installed `@fontsource-variable/inter` for clean UI metrics and navigation.
  - Installed `@fontsource-variable/source-serif-4` for editorial headers and speech transcripts.
  - Configured monospace numbers (`tabular-nums`) for timecodes and scalar metrics.
- **Brand Identity**:
  - Renamed from "SpeechScope AI" to **SpeechScope** across all UI elements, headings, metadata, API health checks, and documentation.
  - Created SVG waveform icon wordmark in `BrandWordmark.tsx` and abstract 5-bar vector favicon in `public/favicon.svg`.
  - Removed template leftovers: deleted `src/App.css`, `hero.png`, `react.svg`, `vite.svg`.
- **UI Primitives Suite**:
  - Created reusable design-token components in `src/components/ui/`: `Button`, `Input`, `Textarea`, `Badge`, `Card`, `Table`, `Tabs`, `Dropzone`, `Skeleton`, `Banner`, `EmptyState`, and `ErrorBoundary`.

---

### Page Overhauls & Functional Enhancements

#### 1. Landing Page (`/`)
- Editorial layout with bold serif statement: *"Objective speech delivery analytics grounded against master recordings."*
- SVG architectural data-flow preview showing reference vs participant alignment.
- 3-step numbered workflow:
  1. Upload reference & participant audio.
  2. Temporal Dynamic Time Warping & feature comparison.
  3. Actionable coaching with sub-second flaw grounding.
- Direct links to evaluate audio or explore the reference dataset.

#### 2. New Evaluation Page (`/evaluate`)
- 720px focused single-column form.
- Two drag-and-drop file dropzones with immediate audio playback previews:
  - Reference delivery (`#1F4E79` badge)
  - Participant delivery (`#C2571A` badge)
- Auto-expanding transcript editor with live word count calculation.
- "Load Sample Speech" button for one-click testing with Pericles Funeral Oration excerpt.

#### 3. Processing Page (`/processing/:id`)
- Clean, focused card with real backend progress tracking (0% to 100%).
- Step indicator displaying active pipeline stage (Validation -> Recognition -> Feature Extraction -> Alignment -> Flaw Detection -> Rubric Scoring).
- Live elapsed duration timer (`Elapsed: Xs`).
- Adaptive polling starting at 1.5s with backoff to 3.0s after 20s.
- "Run in background" link directly navigating to `/evaluations`.

#### 4. Results Page (`/results/:id`)
- **Score Display**:
  - SVG circular gauge with serif score value and category badges (Excellent, Competent, Developing, Needs Practice).
  - Three analytical pillars: Baseline Similarity, Grounding Confidence, Delivery Flaws count.
- **Waveform Comparison**:
  - Stacked waveforms styled in soft light blue (`#A6C8E0`) and soft terracotta (`#E8B896`).
  - Interactive flaw overlays with hover tooltips and click-to-seek.
  - Transport bar with Play/Pause (Spacebar shortcut), Stop/Restart, playback rates (0.75x–1.5x), and "Lock Playheads" synchronized listening.
- **Two-Pane Flaw Inspector**:
  - Left pane: Chronological timeline with severity filters (All, High, Medium, Low).
  - Right pane: Plain-language diagnosis, concrete actionable coaching advice, and expandable technical measurement comparison table.
  - Keyboard shortcuts: `[` (previous flaw) and `]` (next flaw).
- **Acoustic Trajectory Curves**:
  - Recharts component displaying Pitch (F0), Loudness (RMS), Cadence (WPM), and Composite Deviation score on light grid with active flaw shading.
- **Deterministic Rubric Card**:
  - 6-dimension breakdown with calibrated score bars, weight percentages, and category descriptions.
- **Editorial Transcript**:
  - High-readability serif font with subtle 2px colored underlines and word-level audio synchronization.
- **Print Styles**:
  - Clean `@media print` rules hiding interactive transport bars and formatting for print/PDF export.

#### 5. Dataset Explorer (`/dataset`)
- Visual 5-tier quality & severity gradient matrix (Ideal, Almost Perfect, Mildly Flawed, Moderately Flawed, Severely Flawed).
- Monotonicity verification summary table displaying pass status across 10 gradient variants.
- Table of reference speeches with integrated audio previews and "Evaluate Variant" trigger.

#### 6. Evaluations History (`/evaluations`)
- Newly introduced route displaying table of past evaluations.
- Shows speech title, date, completion status, overall score, and detected flaws.
- Actions: Open results and delete with confirmation dialog.
- Clean `EmptyState` component when no evaluations are recorded.

---

### Backend Fixes & Stabilization
- **Background Execution**: Decoupled long-running DSP pipelines into background worker threads using dedicated database sessions, updating live `progress` and `current_step` in SQLite.
- **RFC 7233 Audio Streaming**: Implemented HTTP 206 Partial Content range requests in `GET /api/recordings/{id}/audio` for instant seeking in WaveSurfer.
- **Hardcoded Path Elimination**: Removed local hardcoded directories; dynamically resolves `FFMPEG_PATH` from environment variables, system `PATH`, or `imageio_ffmpeg`.
- **Environment & Security**: Added `backend/.env.example`, restricted CORS origins, and added 50MB file size limits with UUID-based upload naming.
- **New Endpoints**:
  - `GET /api/evaluations`: Evaluations history with pagination.
  - `DELETE /api/evaluations/{id}`: Delete evaluation record.
  - `POST /api/evaluations/dataset`: Evaluate dataset variant directly.

---

### Testing & Verification
- **Frontend Test Suite**: 10 unit tests with Vitest testing brand naming, ScoreGauge, RubricCard, and UI primitives.
- **Backend Test Suite**: 4 pytest tests verifying health, history, dataset, and demo endpoints.
- **Acceptance Tests**: 100% pass on identical audio comparison (Score 99/100, 0 flaws) and deterministic scoring (Delta 0.0).
- **Gradient Acceptance**: 100% pass on all 5 contrastive acceptance tests verifying strict monotonicity across speed, volume, and pause gradients, with IoU = 1.0 on pause grounding.
