#!/usr/bin/env python3
"""Build data/situations.json from the situation CSVs in ../situations/.

The CSVs are the editable source (interim CMS). Run this after editing them:
    python3 scripts/build_situations.py
"""
import csv
import json
from pathlib import Path

PWA = Path(__file__).resolve().parent.parent
SRC = PWA.parent / "situations"


def read_csv(path):
    with open(path, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def main():
    categories = [
        {
            "id": c["category_id"],
            "title": c["category"],
            "covers": c["what_it_covers"],
            "on_hold": c["status"].startswith("hold"),
        }
        for c in read_csv(SRC / "situation_categories.csv")
    ]

    situations = {}
    for row in read_csv(SRC / "situations_seed.csv"):
        s = situations.setdefault(row["situation_id"], {
            "id": row["situation_id"],
            "category_id": row["category_id"],
            "title": row["situation"],
            "status": row["status"],
            "notes": row["notes"],
            "names": [],
        })
        s["names"].append({
            "index": int(row["name_index"]),
            "link_type": row["link_type"],
            "dataset_basis": row["dataset_basis"],
            "the_point": row["the_point"] or None,
            "source": row["source"] or None,
            "original_text": row["original_text"] or None,
        })

    out = {"categories": categories, "situations": list(situations.values())}
    path = PWA / "data" / "situations.json"
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(categories)} categories, {len(situations)} situations to {path}")


if __name__ == "__main__":
    main()
