import os
import sys
import json
import subprocess
import numpy as np
import soundfile as sf
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.config import settings
from app.services.audio_service import convert_and_preprocess_audio
from app.services.dataset_generator import (
    apply_speed_change, 
    apply_volume_change_db, 
    apply_monotone_effect, 
    insert_excessive_pause,
    generate_flawed_variants
)

TRANSCRIPT = """Good morning, members of the jury and respected audience.
Today, we must confront the defining challenge of our time: protecting our shared global environment.
We cannot afford hesitation or complacency, because every passing decade reduces our margin for effective action.
True leadership requires decisive commitment, scientific discipline, and unbroken perseverance.
Let us choose responsibility today, so that tomorrow remains worthy of our hopes."""

def synthesize_sentence(text: str, out_wav: Path, rate: int = 0, volume: int = 100):
    ps_script = Path(__file__).resolve().parent / "tts_helper.ps1"
    cmd = [
        "powershell", "-ExecutionPolicy", "Bypass", "-File", str(ps_script),
        "-Text", text,
        "-OutPath", str(out_wav),
        "-Rate", str(rate),
        "-Volume", str(volume)
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)

def main():
    print("Building SpeechScope AI official demo dataset...")
    temp_dir = settings.DATASET_DIR / "temp"
    temp_dir.mkdir(parents=True, exist_ok=True)
    good_dir = settings.DATASET_DIR / "good"
    flawed_dir = settings.DATASET_DIR / "flawed"
    labels_dir = settings.DATASET_DIR / "labels"
    good_dir.mkdir(parents=True, exist_ok=True)
    flawed_dir.mkdir(parents=True, exist_ok=True)
    labels_dir.mkdir(parents=True, exist_ok=True)

    # 1. Synthesize Clean Reference Speech
    ref_raw_path = temp_dir / "ref_raw.wav"
    synthesize_sentence(TRANSCRIPT.replace("\n", " "), ref_raw_path, rate=0, volume=100)
    
    # Preprocess reference speech to 16kHz mono WAV
    ref_proc_meta = convert_and_preprocess_audio(str(ref_raw_path), output_prefix="demo_ref")
    final_ref_path = good_dir / "demo_reference.wav"
    import shutil
    shutil.copy(ref_proc_meta["processed_path"], final_ref_path)
    print(f" -> Reference audio created: {final_ref_path} ({ref_proc_meta['duration']:.2f}s)")

    # 2. Synthesize Participant Speech with Intentional Temporal Flaws:
    # Sentence 1: Good morning... (Normal, Rate=0)
    # Sentence 2: Today, we must confront... (Rushed, Rate=6)
    # Sentence 3: We cannot afford... (Quiet, Volume=35)
    # Silence: 2.8s excessive pause
    # Sentence 4: True leadership... (Normal, Rate=0)
    # Sentence 5: Let us choose responsibility... (Monotone intonation)
    
    sentences = [
        "Good morning, members of the jury and respected audience.",
        "Today, we must confront the defining challenge of our time: protecting our shared global environment.",
        "We cannot afford hesitation or complacency, because every passing decade reduces our margin for effective action.",
        "True leadership requires decisive commitment, scientific discipline, and unbroken perseverance.",
        "Let us choose responsibility today, so that tomorrow remains worthy of our hopes."
    ]

    part_audio_chunks = []
    sr = 16000

    # Part 1: Normal baseline opening
    p1 = temp_dir / "p1.wav"
    synthesize_sentence(sentences[0], p1, rate=0, volume=100)
    d1, _ = sf.read(convert_and_preprocess_audio(str(p1))["processed_path"])
    part_audio_chunks.append(d1)
    part_audio_chunks.append(np.zeros(int(0.4 * sr)))  # standard natural pause

    # Part 2: Rushed delivery (+40% speed)
    p2 = temp_dir / "p2.wav"
    synthesize_sentence(sentences[1], p2, rate=6, volume=100)
    d2, _ = sf.read(convert_and_preprocess_audio(str(p2))["processed_path"])
    part_audio_chunks.append(d2)
    part_audio_chunks.append(np.zeros(int(0.2 * sr)))

    # Part 3: Low vocal energy (-8 dB)
    p3 = temp_dir / "p3.wav"
    synthesize_sentence(sentences[2], p3, rate=0, volume=35)
    d3, _ = sf.read(convert_and_preprocess_audio(str(p3))["processed_path"])
    d3_quiet = apply_volume_change_db(d3, -8.0)
    part_audio_chunks.append(d3_quiet)

    # Insert Awkward Excessive Pause (2.8 seconds silence)
    part_audio_chunks.append(np.zeros(int(2.8 * sr)))

    # Part 4: Normal delivery
    p4 = temp_dir / "p4.wav"
    synthesize_sentence(sentences[3], p4, rate=0, volume=95)
    d4, _ = sf.read(convert_and_preprocess_audio(str(p4))["processed_path"])
    part_audio_chunks.append(d4)
    part_audio_chunks.append(np.zeros(int(0.5 * sr)))

    # Part 5: Monotone delivery (flattened pitch dynamics)
    p5 = temp_dir / "p5.wav"
    synthesize_sentence(sentences[4], p5, rate=0, volume=95)
    d5, _ = sf.read(convert_and_preprocess_audio(str(p5))["processed_path"])
    d5_mono = apply_monotone_effect(d5, sr)
    part_audio_chunks.append(d5_mono)

    # Combine into participant audio
    participant_audio = np.concatenate(part_audio_chunks)
    final_part_path = flawed_dir / "demo_participant.wav"
    sf.write(str(final_part_path), participant_audio, sr, subtype="PCM_16")
    part_duration = len(participant_audio) / sr
    print(f" -> Participant audio created: {final_part_path} ({part_duration:.2f}s)")

    # 3. Save transcript file
    transcript_file = good_dir / "demo_transcript.txt"
    with open(transcript_file, "w", encoding="utf-8") as f:
        f.write(TRANSCRIPT)

    # 4. Generate the full contrastive flaw variants suite
    print(" -> Generating full gradient flaw variants suite...")
    variants = generate_flawed_variants(str(final_ref_path), flawed_dir)

    # 5. Save Labels Metadata
    labels_file = labels_dir / "demo_speech.json"
    demo_labels = {
        "speechId": "demo_speech_001",
        "title": "Environmental Leadership Oratory",
        "transcript": TRANSCRIPT,
        "referenceAudio": str(final_ref_path),
        "participantAudio": str(final_part_path),
        "transcriptFile": str(transcript_file),
        "expectedFlaws": [
            {
                "type": "RUSHED_DELIVERY",
                "approxTime": "00:08 - 00:15",
                "severity": "HIGH",
                "targetSentence": sentences[1]
            },
            {
                "type": "LOW_VOLUME",
                "approxTime": "00:16 - 00:23",
                "severity": "HIGH",
                "targetSentence": sentences[2]
            },
            {
                "type": "EXCESSIVE_PAUSE",
                "approxTime": "00:23 - 00:27",
                "severity": "HIGH",
                "targetSentence": "Mid-speech hesitation gap (2.8s)"
            },
            {
                "type": "MONOTONE",
                "approxTime": "00:32 - 00:40",
                "severity": "MEDIUM",
                "targetSentence": sentences[4]
            }
        ],
        "variants": variants
    }
    with open(labels_file, "w", encoding="utf-8") as f:
        json.dump(demo_labels, f, indent=2)

    print(f" -> Demo dataset labels saved to: {labels_file}")
    print("\n[SUCCESS] Official Demo Dataset successfully built and verified!")

if __name__ == "__main__":
    main()
