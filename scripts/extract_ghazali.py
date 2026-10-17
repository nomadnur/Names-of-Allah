#!/usr/bin/env python3
"""
extract_ghazali.py
==================
Extracts Ghazali commentary from the OCR text of
"The Ninety-Nine Beautiful Names of God" (Al-Maqsad al-Asna)
and maps each entry to names.json by fuzzy transliteration matching.

Outputs two files for human review BEFORE any changes to names.json:
  1. ghazali_extracted.tsv  — tab-separated review sheet
  2. ghazali_extracted.json — machine-readable for the apply step

Usage:
  python3 scripts/extract_ghazali.py
  # review outputs, then run:
  python3 scripts/apply_ghazali.py   (written after review)

Author: Claude (content pipeline)
Source: Al-Ghazali, Al-Maqsad al-Asna (trans. Burrell & Daher)
"""

import json
import re
import unicodedata
import os
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────
PWA_ROOT    = Path(__file__).resolve().parent.parent         # .../pwa/
CONTENT_ROOT = PWA_ROOT.parent                               # .../Names of Allah/
OCR_PATH    = CONTENT_ROOT / "sources/extracts/text/al-ghazali-theninety-ninebeautifulnamesofgod-text.txt"
NAMES_JSON  = PWA_ROOT / "data/names.json"
OUT_TSV     = PWA_ROOT / "scripts/ghazali_extracted.tsv"
OUT_JSON    = PWA_ROOT / "scripts/ghazali_extracted.json"


# ── Step 1: Load source files ──────────────────────────────────────────────────
print("Loading files...")
ocr_text = OCR_PATH.read_text(encoding="utf-8")
with open(NAMES_JSON) as f:
    names_data = json.load(f)
names_list = names_data if isinstance(names_data, list) else names_data.get("names", [])


# ── Step 2: Pre-process OCR text ───────────────────────────────────────────────
# Remove page markers and join into single stream
clean = re.sub(r'### PAGE \d+\n?', '', ocr_text)
# Remove running headers like "NINETY-NINENAMES\n" and "PartTwo:ChapterOne\n"
clean = re.sub(r'NINETY-NINENAMES\n?', '', clean)
clean = re.sub(r'PartTwo:ChapterOne\n?', '', clean)
# Remove bare page numbers (digits on their own line like "49\n", "52\n" etc.)
clean = re.sub(r'\n\d{1,3}\n', '\n', clean)
# Collapse multiple newlines
clean = re.sub(r'\n{2,}', ' ', clean)
clean = re.sub(r'\n', ' ', clean)


# ── Step 3: Find all name entry positions ─────────────────────────────────────
# Pattern: one or two numbers, period, then name starting with capital
# e.g. "2,3.Al-Rahman,Al-Rahim—" or "15.Al-Ghaffar—" or "84.Malikal-Mulk—"
NAME_ENTRY_RE = re.compile(
    r'(\d{1,2}(?:,\d{1,2})?\.'          # number(s) + period
    r'(?:Al-|Ar-|As-|Adh-|Az-|An-|Ad-|At-|Dhu|Malik|Allah|Subhan)'  # name prefix
    r'[A-Za-z\'\-c"]+)'                  # rest of name
    r'(?:,\s*(?:Al-|Ar-|As-|)[A-Za-z\'\-c"]+)?'  # optional second name
    r'\s*[—–-]\s*'                       # dash separator
)

matches = list(NAME_ENTRY_RE.finditer(clean))
print(f"Found {len(matches)} name entries in OCR text")


# ── Step 4: Extract commentary text for each entry ────────────────────────────
entries = []
for i, m in enumerate(matches):
    start = m.start()
    end   = matches[i + 1].start() if i + 1 < len(matches) else len(clean)

    raw_header = m.group(0)
    body       = clean[start:end].strip()

    # Parse the number(s) from the header
    nums_str = re.match(r'^(\d{1,2}(?:,\d{1,2})?)', raw_header).group(1)
    ghazali_nums = [int(x) for x in nums_str.split(",")]

    # Extract the transliteration(s) from the header
    trans_match = re.findall(r'((?:Al-|Ar-|As-|Adh-|Az-|An-|Ad-|At-|Dhu|Malik|Allah|Subhan)[A-Za-z\'\-c"]+)', raw_header)
    ghazali_trans = trans_match[0] if trans_match else ""

    entries.append({
        "ghazali_nums":  ghazali_nums,
        "ghazali_trans": ghazali_trans,
        "raw_header":    raw_header.strip(),
        "body":          body,
        "char_start":    start,
    })

print(f"Extracted {len(entries)} commentary entries")


# ── Step 5: Clean OCR text for readability ────────────────────────────────────
def add_spaces_to_concatenated(text):
    """
    Heuristically re-insert spaces in OCR-concatenated text.
    Handles patterns like "theonewhois..." → "the one who is..."
    This is approximate — the TSV review step catches errors.
    """
    # Insert space before known section markers
    for marker in ["Counsel:", "Lesson.", "Implications.", "Alesson.", "Anotherlesson."]:
        text = text.replace(marker, f"\n\n{marker}")

    # Insert space before capital letters that follow lowercase
    # (conservative — only common Islamic/English patterns)
    text = re.sub(r'([a-z])([A-Z][a-z])', r'\1 \2', text)
    # Fix "God—greatandglorious" → "God—great and glorious"
    text = re.sub(r'([a-z])and([a-z])', r'\1 and \2', text)
    text = re.sub(r'([a-z])or([a-z])', r'\1 or \2', text)
    text = re.sub(r'([a-z])of([a-z])', r'\1 of \2', text)
    text = re.sub(r'([a-z])to([a-z])', r'\1 to \2', text)
    text = re.sub(r'([a-z])in([a-z])', r'\1 in \2', text)
    text = re.sub(r'([a-z])the([a-z])', r'\1 the \2', text)
    text = re.sub(r'([a-z])is([a-z])', r'\1 is \2', text)
    text = re.sub(r'([a-z])by([a-z])', r'\1 by \2', text)
    text = re.sub(r'([a-z])not([a-z])', r'\1 not \2', text)
    text = re.sub(r'([a-z])his([a-z])', r'\1 his \2', text)
    text = re.sub(r'([a-z])who([a-z])', r'\1 who \2', text)
    text = re.sub(r'([a-z])which([a-z])', r'\1 which \2', text)
    text = re.sub(r'([a-z])with([a-z])', r'\1 with \2', text)
    text = re.sub(r'([a-z])from([a-z])', r'\1 from \2', text)
    text = re.sub(r'([a-z])that([a-z])', r'\1 that \2', text)
    text = re.sub(r'([a-z])for([a-z])', r'\1 for \2', text)
    text = re.sub(r'([a-z])has([a-z])', r'\1 has \2', text)
    text = re.sub(r'([a-z])him([a-z])', r'\1 him \2', text)
    # Clean up extra spaces
    text = re.sub(r'  +', ' ', text)
    return text.strip()


def extract_counsel(body):
    """Pull out just the Counsel/Lesson section if present."""
    for marker in ["Counsel:", "\n\nCounsel:", "Alesson.", "\n\nAlesson.", "Lesson."]:
        idx = body.find(marker)
        if idx != -1:
            return body[idx:].strip()
    return ""


# ── Step 6: Fuzzy match to names.json ─────────────────────────────────────────
def normalise_root(s):
    """
    Extract and normalise the name root for matching.
    Strips Al-/Ar-/As-/etc. prefix, then applies OCR corrections.
    """
    s = s.strip()
    # Remove prefix (Al-, Ar-, As-, Az-, An-, Ad-, At-, Adh-, Dhu-, Malik-)
    s = re.sub(r"^(?:Al|Ar|As|Az|An|Ad|At|Adh)-", "", s, flags=re.IGNORECASE)
    s = re.sub(r"^(?:Dhu'?l?-|Malik\s*al-)", "", s, flags=re.IGNORECASE)
    s = s.lower()
    # Known OCR character substitutions in this scan
    s = s.replace("c", "")        # c = 'ayn — just drop it for matching
    s = s.replace('"', "")
    s = s.replace("'", "")
    s = s.replace("-", "")
    s = s.replace("i", "ee")      # short i often = long ee in Arabic transliteration
    s = s.replace("T", "ee")      # Capital T in OCR = ī / long i
    # Doubled letters normalisation (Rahmaan → rahman, etc.)
    s = re.sub(r"(.)\1+", r"\1", s)   # collapse doubled chars
    # Remove non-alpha
    s = re.sub(r"[^a-z]", "", s)
    return s


def levenshtein(a, b):
    """Simple edit distance."""
    if not a: return len(b)
    if not b: return len(a)
    dp = list(range(len(b) + 1))
    for i, ca in enumerate(a):
        ndp = [i + 1]
        for j, cb in enumerate(b):
            ndp.append(min(dp[j] + (0 if ca == cb else 1),
                           dp[j + 1] + 1,
                           ndp[j] + 1))
        dp = ndp
    return dp[-1]


def best_match(ghazali_trans, names_list):
    """
    Match Ghazali transliteration to names.json entry.
    Uses root normalisation + Levenshtein distance.
    Returns (name_entry, confidence 0-1) or (None, 0).
    Threshold: confidence < 0.55 → no match (returns None).
    """
    g_root = normalise_root(ghazali_trans)
    if not g_root:
        return None, 0.0

    best_score = 0.0
    best_name  = None

    for name in names_list:
        t_root = normalise_root(name["transliteration"])
        if not t_root:
            continue
        max_len = max(len(g_root), len(t_root))
        if max_len == 0:
            continue
        dist = levenshtein(g_root, t_root)
        score = 1.0 - dist / max_len
        if score > best_score:
            best_score = score
            best_name  = name

    if best_score < 0.55:
        return None, round(best_score, 2)
    return best_name, round(best_score, 2)


# ── Step 7: Build review output ───────────────────────────────────────────────
print("\nMatching to names.json...")
results = []

for entry in entries:
    cleaned_body = add_spaces_to_concatenated(entry["body"])
    counsel      = add_spaces_to_concatenated(extract_counsel(entry["body"]))

    # Try each name transliteration in the entry
    matched_name, confidence = best_match(entry["ghazali_trans"], names_list)

    results.append({
        "ghazali_nums":      entry["ghazali_nums"],
        "ghazali_trans":     entry["ghazali_trans"],
        "matched_index":     matched_name["index"] if matched_name else None,
        "matched_trans":     matched_name["transliteration"] if matched_name else None,
        "matched_arabic":    matched_name["arabic"] if matched_name else None,
        "confidence":        confidence,
        "current_insight":   matched_name.get("ghazali_insight", "") if matched_name else "",
        "extracted_body":    cleaned_body,
        "extracted_counsel": counsel,
        "review_flag":       "CHECK" if confidence < 0.65 else ("PAIRED" if len(entry["ghazali_nums"]) > 1 else "OK"),
    })

# Sort by matched_index for easy review
results.sort(key=lambda r: r["matched_index"] or 999)

# ── Step 8: Write TSV (for review in spreadsheet) ─────────────────────────────
TSV_COLS = [
    "review_flag", "matched_index", "matched_trans", "matched_arabic",
    "ghazali_nums", "ghazali_trans", "confidence",
    "current_insight_truncated", "extracted_body_preview", "extracted_full",
]

with open(OUT_TSV, "w", encoding="utf-8") as f:
    f.write("\t".join(TSV_COLS) + "\n")
    for r in results:
        current_trunc = (r["current_insight"] or "")[:120].replace("\t", " ").replace("\n", " ")
        body_preview  = r["extracted_body"][:200].replace("\t", " ").replace("\n", " ")
        body_full     = r["extracted_body"].replace("\t", " ").replace("\n", " ")
        row = [
            r["review_flag"],
            str(r["matched_index"] or ""),
            r["matched_trans"] or "",
            r["matched_arabic"] or "",
            ",".join(str(n) for n in r["ghazali_nums"]),
            r["ghazali_trans"],
            str(r["confidence"]),
            current_trunc,
            body_preview,
            body_full,
        ]
        f.write("\t".join(row) + "\n")

# ── Step 9: Write JSON ─────────────────────────────────────────────────────────
with open(OUT_JSON, "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

# ── Step 10: Print summary ────────────────────────────────────────────────────
ok      = sum(1 for r in results if r["review_flag"] == "OK")
paired  = sum(1 for r in results if r["review_flag"] == "PAIRED")
check   = sum(1 for r in results if r["review_flag"] == "CHECK")
matched = sum(1 for r in results if r["matched_index"])

print(f"\n{'='*60}")
print(f"Extraction complete")
print(f"  Total entries extracted : {len(results)}")
print(f"  Matched to names.json   : {matched}")
print(f"  High confidence (OK)    : {ok}")
print(f"  Paired names            : {paired}")
print(f"  Need review (CHECK)     : {check}")
print(f"\nOutputs:")
print(f"  {OUT_TSV}")
print(f"  {OUT_JSON}")
print(f"\nNext step: review TSV, then run apply_ghazali.py")
