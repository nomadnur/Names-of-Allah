#!/usr/bin/env python3
"""Build data/videos.json from ../videos/video_catalog.csv.

Two kinds of video:
  explanation  the video is about the Name (linked by its title)
  dhikr        the video explains a dhikr whose words contain the Name, or a
               dhikr for a situation (SHIELD). It is labelled as dhikr use, not
               as an explanation of the Name.

    python3 scripts/build_videos.py
"""
import csv
import re
import json
from pathlib import Path

PWA = Path(__file__).resolve().parent.parent
SRC = PWA.parent / "videos" / "video_catalog.csv"


def topic(title):
    """'SHIELD | ... | Part 18 | Entrust Your Matters To Allah (1/2) | Abu Bakr Zoud' -> the episode topic."""
    parts = [p.strip() for p in title.split("|")]
    keep = [p for p in parts if p and not re.search(r"SHIELD|Athkaar|Thikr|Abu ?Bakr|^Part \d+$", p)]
    return keep[-1] if keep else title


def main():
    videos = []
    with open(SRC, newline="", encoding="utf-8-sig") as f:
        for row in csv.DictReader(f):
            situations = [x for x in row["situation_ids"].split(";") if x]
            names = [int(i) for i in row["name_indexes"].split(";") if i]
            if not names and not situations:
                continue
            kind = "explanation" if row["link_basis"] == "video title" else "dhikr"
            videos.append({
                "id": row["video_id"],
                "kind": kind,
                "series": row["series"],
                "speaker": row["speaker"],
                "part": int(row["part"]),
                "episode": row.get("episode_label") or None,
                "duration": row["duration"],
                "title": row["title"],
                "topic": topic(row["title"]) if kind == "dhikr" else None,
                "names": names,
                "situations": situations,
                "note": row["notes"] if kind == "explanation" and row["notes"] else None,
            })
    path = PWA / "data" / "videos.json"
    path.write_text(json.dumps({"videos": videos}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    covered = {i for v in videos for i in v["names"]}
    kinds = {k: sum(1 for v in videos if v["kind"] == k) for k in ("explanation", "dhikr")}
    sits = {s for v in videos for s in v["situations"]}
    print(f"Wrote {len(videos)} videos {kinds}, covering {len(covered)} Names and {len(sits)} situations to {path}")


if __name__ == "__main__":
    main()
