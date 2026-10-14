# SpeechScope Design System & Architecture Guide

## 1. Design Vision & Philosophy

**SpeechScope** is an objective speech delivery analytics and temporal flaw grounding platform designed for speech coaches, debate adjudicators, and competitive forensics speakers.

The design philosophy replaces generic "AI demo" tropes (dark navy backgrounds, neon cyan/indigo gradients, pulsing glowing blobs, and machine-generated cards) with a **calm, disciplined, human-crafted analyst aesthetic** inspired by Linear, Stripe Dashboard, and Notion.

### Core Principles
1. **Calm Clarity**: Warm paper backgrounds (`#F7F6F3`) and crisp white surfaces (`#FFFFFF`) with subtle 1px borders (`#E3E0D8`) provide a distraction-free environment for serious forensic analysis.
2. **Editorial Typography**: Pairing **Inter Variable** for crisp UI metrics with **Source Serif 4** for speech transcripts and rhetorical excerpts elevates speech delivery from a synthetic test into an art of competitive communication.
3. **Restrained Data Visualization**: Recharts lines, waveforms, and rubric bars use a grounded palette (Deep Teal `#1F4E79` for reference baseline; Warm Terracotta `#C2571A` for participant performance).
4. **Actionable Coaching First**: Forensic data is paired with plain-language diagnostic summaries, followed by actionable coaching recommendations, with detailed numeric tables available on demand.

---

## 2. Color System & Design Tokens

SpeechScope uses semantic CSS custom properties defined in `:root` and mirrored in Tailwind CSS v4 `@theme`.

### Surface Palette
| Token | Hex Value | Semantic Role |
| :--- | :--- | :--- |
| `--bg` | `#F7F6F3` | Root workspace background (warm paper tone) |
| `--surface` | `#FFFFFF` | Analytical cards, dropdowns, modal sheets |
| `--surface-2` | `#F1EFEA` | Secondary surfaces, waveform containers, transcript background |
| `--border` | `#E3E0D8` | Default structural borders and divider lines |
| `--border-strong` | `#CFCBC0` | Interactive card borders, hover states, input outlines |

### Typography & Contrast
| Token | Hex Value | Contrast Ratio (vs #FFFFFF) | Role |
| :--- | :--- | :--- | :--- |
| `--text` / `--foreground` | `#1C1B19` | 16.4 : 1 (Exceeds AAA) | Primary headings, titles, active data |
| `--text-muted` / `--muted-foreground` | `#5E5B54` | 5.8 : 1 (Exceeds AA) | Secondary descriptions, timestamps, axis labels |
| `--text-subtle` | `#8A867C` | 3.2 : 1 | Disabled text, decorative captions |

### Data & Series Palette
| Series | Base Hex | Soft Background / Tint | Purpose |
| :--- | :--- | :--- | :--- |
| **Reference Baseline** | `#1F4E79` | `#A6C8E0` | Ideal model delivery waveform and acoustic curves |
| **Participant Speech** | `#C2571A` | `#E8B896` | Participant waveform, deviation vectors, flaw highlights |
| **High Severity Flaw** | `#B5372B` | `rgba(181, 55, 43, 0.15)` | Statistically extreme deviations (> ±30% pace, -10 dB) |
| **Medium Severity Flaw**| `#D9822B` | `rgba(217, 130, 43, 0.15)` | Moderate deviations (> ±20% pace, -6 dB) |
| **Low Severity Flaw** | `#D9B44A` | `rgba(217, 180, 74, 0.15)` | Minor deviations (> ±10% pace) |

---

## 3. Typography Hierarchy

SpeechScope bundles self-hosted variable font packages to ensure zero runtime network latency and consistent cross-platform rendering:

```css
@import "@fontsource-variable/inter";
@import "@fontsource-variable/source-serif-4";
```

- **UI Sans (`Inter Variable`)**: Used for navigation, action buttons, table cells, metric labels, and structural cards. Set with `font-sans antialiased`.
- **Editorial Serif (`Source Serif 4 Variable`)**: Used for page titles (`font-serif font-bold text-2xl`), speech excerpts, and transcript inspection (`font-serif text-[17px] leading-relaxed`).
- **Tabular Mono (`JetBrains Mono` / `ui-monospace`)**: Used for all numeric readouts, timecodes (`00:14.2`), score values, and scalar acoustic units (`font-mono tabular-nums`).

---

## 4. Key Interactive Components

### 1. Unified Waveform Comparison
- **Stacked Dual Waveforms**: Aligns Reference (`#1F4E79`) and Participant (`#C2571A`) audio over Dynamic Time Warping (DTW) tracks.
- **Flaw Region Overlays**: Semi-transparent interactive bands positioned via sub-second timestamps (`start / duration`). Hovering displays flaw title tooltips; clicking selects the flaw in the index and scrubs playback.
- **Transport Bar**: Spacebar shortcut for Play/Pause, speed selector (0.75x, 1.0x, 1.25x, 1.5x), Lock Playheads toggle for simultaneous synchronized listening, and millisecond timecodes.

### 2. Two-Pane Flaw Diagnostics & Coaching
- **Left Pane (Flaw Index)**: Chronologically sorted flaw list with severity filters (All, High, Medium, Low), timestamp pills (`00:14.2 – 00:17.8`), and flaw titles. Keyboard navigation via `[` (previous) and `]` (next).
- **Right Pane (Flaw Card)**:
  1. Spoken Delivery Excerpt (`font-serif italic`).
  2. Delivery Diagnosis (Plain-language explanation).
  3. Actionable Coaching Guidance (Concrete advice on how to breathe, cadence, or modulate).
  4. Expandable Measurement Table: Reference vs Participant values, percentage deltas, and threshold compliance status.

### 3. Editorial Transcript Viewer
- Replaces blocky neon highlighting with subtle 2px colored underlines (`border-b-2 border-rose-600` for high severity, `border-b-2 border-amber-600` for medium severity).
- Click-to-seek: Clicking any word or sentence immediately repositions the audio playhead and highlights the corresponding acoustic event.

### 4. Deterministic Rubric Breakdown
- Compact 6-dimension breakdown: Pacing Cadence, Pitch Variation, Pause Dynamics, Vocal Energy, Articulation Clarity, and Delivery Rhythm.
- Calibrated score bars showing individual score `/ 100` alongside dimension weight percentage.

---

## 5. Accessibility & Responsive Engineering

1. **WCAG AA Compliance**: All text tokens exceed standard contrast thresholds (minimum 4.5:1 for body copy; 3:1 for large headers).
2. **Keyboard Navigation**:
   - `Space`: Toggle audio playback
   - `[` / `]`: Navigate to previous/next flaw
   - `Enter` / `Space` on list items: Select and inspect flaw
   - Standard Tab/Shift-Tab focus loops with `focus-visible:ring-2 focus-visible:ring-[#1F4E79]`.
3. **Print Optimization**: Dedicated `@media print` stylesheet hides transport buttons, removes backgrounds, expands data tables, and ensures clean page breaks for PDF evaluation exports.
