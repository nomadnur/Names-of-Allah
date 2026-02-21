#!/usr/bin/env python3
"""
CSV to JSON Converter for Names of Allah PWA
Converts asmaul_husna_canonical.csv to names.json

Usage:
    python3 scripts/csv_to_json.py
"""

import csv
import json
import sys
from pathlib import Path

def convert_csv_to_json(csv_path, json_path):
    """Convert CSV to JSON with proper type handling."""

    try:
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            names = []

            for row in reader:
                # Convert index to integer
                row['index'] = int(row['index'])

                # Convert empty strings to None for optional fields
                for key in row:
                    if row[key] == '':
                        row[key] = None

                names.append(row)

        # Validate count
        if len(names) != 99:
            print(f"⚠️  Warning: Expected 99 names, found {len(names)}")

        # Write JSON with proper formatting
        with open(json_path, 'w', encoding='utf-8') as jsonfile:
            json.dump(names, jsonfile, ensure_ascii=False, indent=2)

        print(f"✅ Successfully converted {len(names)} names")
        print(f"📄 Input:  {csv_path}")
        print(f"📄 Output: {json_path}")

        # Print stats
        quran_count = sum(1 for n in names if n.get('source_type') == 'quran')
        sunnah_count = sum(1 for n in names if n.get('source_type') == 'sunnah')
        print(f"\n📊 Stats:")
        print(f"   - Names from Quran: {quran_count}")
        print(f"   - Names from Sunnah: {sunnah_count}")

        # Check for missing required fields
        required_fields = ['arabic', 'transliteration', 'english_meaning', 'bahasa_meaning']
        for field in required_fields:
            missing = sum(1 for n in names if not n.get(field))
            if missing > 0:
                print(f"   ⚠️  Missing {field}: {missing} names")

        return True

    except FileNotFoundError:
        print(f"❌ Error: CSV file not found at {csv_path}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    # Paths
    project_root = Path(__file__).parent.parent
    csv_path = project_root.parent / "asmaul_husna_canonical.csv"
    json_path = project_root / "data" / "names.json"

    print("🕌 Names of Allah - CSV to JSON Converter\n")

    # Check if CSV exists
    if not csv_path.exists():
        print(f"❌ CSV file not found: {csv_path}")
        print("\nExpected location:")
        print(f"   {csv_path}")
        sys.exit(1)

    # Create data directory if needed
    json_path.parent.mkdir(exist_ok=True)

    # Convert
    success = convert_csv_to_json(csv_path, json_path)

    if success:
        print("\n✅ Conversion complete! Ready for PWA.")
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
