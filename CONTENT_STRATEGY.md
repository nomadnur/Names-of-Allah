# Content Strategy — Names of Allah Dataset

**Status:** v1 dataset is demo-quality. Production enrichment not yet started.
**Owner:** Nur Ahmad Furlong
**Last updated:** 2026-03-21

---

## The Problem

The app's UX is built. The dataset underpinning it is not.

`data/names.json` was assembled in Feb 2026 by merging three local sources:
1. Shaykh Uthaymeen's list (Arabic, transliteration, source type)
2. A Ghazali-derived comprehensive guide (aqeedah, theological commentary)
3. A retention CSV (bahasa, practical guidance fields)

The merge was a first pass. Coverage is uneven, ~37 names have gaps in Bahasa/practical fields, and the scholarly depth of each entry does not yet reflect the richness of the source material.

**The data is functional enough to demonstrate the app. It is not ready to teach.**

---

## What "Production-Ready" Looks Like

Each of the 99 names should have:

| Field | Target | Current |
|-------|--------|---------|
| `arabic` | 99/99 with verified tashkeel | ✅ 99/99 |
| `transliteration` | 99/99 | ✅ 99/99 |
| `english_meaning` | 99/99 — concise, Uthaymeen-faithful | ✅ 99/99 |
| `bahasa_meaning` | 99/99 | ~65/99 |
| `proof_quran` | Verified ayah + surah for all 81 Quranic names | ~70% |
| `proof_hadith` | Verified hadith ref for all 18 Sunnah names | ~20% |
| `aqeedah_belief` | 2–3 sentences on what this name means for belief | ~80% |
| `ghazali_insight` | Al-Maqsad al-Asna insight where available | ~40% |
| `when_to_invoke` | Practical: when in life to call on this name | ~65% |
| `salah_usage` | How to bring this name into prayer | ~65% |
| `dua_usage` | Dua guidance | ~65% |
| `dhikr_usage` | Dhikr guidance | ~65% |
| `description_en` | 1–2 para rich description (EN) | ~50% |
| `description_ms` | 1–2 para rich description (BM) | ~30% |

---

## Source Inventory

### Available locally (in `sources/` and `datasets/`)

| Source | Location | Richness | Use for |
|--------|----------|----------|---------|
| Uthaymeen PDF (Arabic + English) | `sources/` | High — canonical | Base list, source types, proof references |
| Al-Maqsad al-Asna — Ghazali (EN) | `sources/imports/` | High — theological | Ghazali insights, aqeedah, description_en |
| Retention CSV v4 | `datasets/retention/core/` | Medium | Bahasa, practical guidance, when_to_invoke |
| Canonical enriched JSON | `datasets/canonical/core/` | Medium | Current merged state |
| Deep research report | `project_docs/research/analysis/` | High — narrative | Description fields, theological commentary |

### Google NotebookLM (primary enrichment source — not yet mined)

The owner has a Google NotebookLM notebook with multiple scholarly sources uploaded. **This is the highest-leverage enrichment path** because:

- It enables citation-grounded answers (not AI hallucination)
- Can be queried systematically, name by name
- Sources include material not yet in the local dataset

**Before mining, establish the NotebookLM sources list** — which books/texts are uploaded? Then design queries per field type (see query templates below).

---

## Enrichment Strategy

### Phase 1: Audit what's missing (before writing anything)

Run `scripts/csv_to_json.py` logic in reverse — generate a completeness report showing which names are missing which fields. This already exists as `_DATA_QUALITY_REPORT.md` in `project_docs/dataset_governance/` — update it from the current `names.json`.

### Phase 2: Mine NotebookLM systematically

**Query template per name:**

```
For the Name: [Arabic] ([Transliteration])

1. What does this name mean in the context of aqeedah (Islamic belief)?
   Cite the specific text and page.

2. What Quranic verse or hadith is the evidence for this name?
   Give the exact reference.

3. What practical guidance does [source] give on when to invoke this name?
   In what life situations should a Muslim call on Allah by this name?

4. What dhikr, dua, or salah practice is connected to this name?

5. Is there a Ghazali commentary on this name in Al-Maqsad al-Asna?
   Quote the key insight.
```

**Batch approach:** Group names by similarity (mercy names, power names, knowledge names) so context carries across queries.

### Phase 3: Bahasa enrichment

For the ~37 names missing `bahasa_meaning` and `description_ms`:
- Cross-reference the retention CSV v4 (already partially done)
- Use a BM-language scholarly source in NotebookLM if available
- Or: translate verified EN content with proper Islamic terminology review

### Phase 4: Proof reference verification

The current `proof_quran` fields were auto-generated and need scholarly verification:
- Cross-check each reference against an authenticated Quran API (e.g., quran.com)
- Flag any that don't match

This work already started: see `project_docs/pwa/research/audits/quran_reference_name_match_audit*.md`

---

## Dataset Governance

- **Never edit `data/names.json` directly for scholarly content** — work in `datasets/canonical/core/` first, then run `scripts/csv_to_json.py`
- **Source everything** — every enriched field must have a `source_reference` value
- **Version the dataset** — use the backup pattern (`names.json.backup-YYYYMMDD`) before any bulk update
- **Track completeness** — update `_DATA_QUALITY_REPORT.md` after every enrichment pass

---

## What This Unlocks

Full dataset quality is the prerequisite for:
- Integration into Ikhlas.com as a feature (not just a standalone PWA)
- Using the content in push notifications, onboarding flows, and retention mechanics
- Arabic/BM audio pronunciation (requires verified text first)
- A teacher/study group mode (requires rich descriptions)

---

## Next Action

1. Share the NotebookLM notebook sources list
2. Define a priority order (which 20 names to enrich first — likely the most well-known: Ar-Rahman, Ar-Rahim, Al-Malik, Al-Quddus, etc.)
3. Run Phase 1 audit to generate the exact gap list
4. Begin systematic Phase 2 queries
