import os
import sys
import argparse
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.config import settings
from app.services.dataset_generator import generate_flawed_variants

def main():
    parser = argparse.ArgumentParser(description="Generate synthetic flawed speech audio variants from reference WAV.")
    parser.add_argument("--input", "-i", type=str, required=True, help="Path to clean/reference WAV audio file")
    parser.add_argument("--output_dir", "-o", type=str, default=str(settings.DATASET_DIR / "flawed"), help="Output directory")
    args = parser.parse_args()

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"Error: Input file {args.input} does not exist.")
        sys.exit(1)

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"Generating contrastive speech flaw variants from {input_path.name}...")
    variants = generate_flawed_variants(str(input_path), out_dir)
    for v in variants:
        print(f" -> Generated: {v['variantName']} (Expected: {v['expectedFlaw']}, Severity: {v['severity']})")
        print(f"    Saved to: {v['filePath']}")

    print("\nGeneration complete!")

if __name__ == "__main__":
    main()
