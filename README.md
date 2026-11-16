# Names of Allah PWA

A mobile-first Progressive Web App for learning and memorizing the 99 Beautiful Names of Allah (Asma'ul Husna), with authentic sources from the Quran and Sunnah.

**Live:** [nurahmadfurlong.com/names-of-allah](https://nurahmadfurlong.com/names-of-allah/)

---

## Current Status

### App (Stages 1–4 complete; Stage 5 mostly built)

| Stage | Feature | Status |
|-------|---------|--------|
| 1 | Foundation — PWA shell, manifest, service worker, design system | ✅ Done |
| 2 | Browse mode — 99 names, detail modals, search, favorites | ✅ Done |
| 3 | Memorization mode — spaced repetition (SRS), flashcards, sessions | ✅ Done |
| 4 | Progress dashboard — 99-dot grid, stats, review queue | ✅ Done |
| 4.5 | Situations finder & video gallery (`situations.js`, `gallery.js`) | ✅ Done |
| 5 | Polish — dark mode & share (✅ Done); full a11y & Lighthouse 90+ audit (⏳ Pending) | 🟡 In Progress |

### Content (v1.28 — active verification & enrichment)

> **Note:** The dataset (`data/names.json`) is actively verified against primary Qur'an, Hadith, Ghazali (*Al-Maqsad al-Asna*), Shaykh Al-Jalil, and Al-Biqa'i (*Nazm al-Durar*, Turath 9098) sources. Practical fields (`when_to_invoke`, `salah_usage`, `dhikr_usage`) still have boilerplate/coverage gaps in progress. See [`CONTENT_STRATEGY.md`](CONTENT_STRATEGY.md) for the roadmap.

| Field | Completeness | Notes |
|-------|-------------|-------|
| arabic | ✅ 99/99 | With tashkeel (diacritics) |
| transliteration | ✅ 99/99 | Uthaymeen romanisation |
| english_meaning | ✅ 99/99 | Concise |
| bahasa_meaning | ✅ 99/99 | Malay translations complete |
| proof_quran | ✅ 83/99 | Direct `quran.com` verse links |
| proof_hadith | ✅ 16/99 | 15/16 linked to `sunnah.com`; #96 Al-Muhsin cites At-Tabarani (*Al-Sahihah* 470) |
| aqeedah_belief | ✅ 99/99 | From Ghazali / Uthaymeen / verified summaries |
| ghazali_insight | 🟡 78/99 | Repaired from Burrell & Daher; remaining 21 are not in *Al-Maqsad al-Asna* |
| al_jalil_commentary | ✅ 97/99 | Shaykh Abdul Aziz Al-Jalil (*ولله الأسماء الحسنى فادعوه بها*) |
| nazm_al_durar_insight | 🟡 9/99 | Al-Biqa'i (*Nazm al-Durar*, Turath 9098) with linked Arabic/English ayahs |
| secondary_quran_refs | 🟡 1/99 | Additional Qur'an mentions (indefinite/extra verses; started on #79 Al-Wakeel) |
| when_to_invoke | 🟡 99/99 | Filled, 48 boilerplate entries queued for replacement |
| salah_usage | 🟡 74/99 | 25 missing + boilerplate cleanup queued |
| dhikr_usage_en / _ms | 🟡 75/99 | Split into separate EN and BM fields; 24 remaining |

---

## Tech Stack

- **Pure Web Standards** — no frameworks, no build tools
- HTML5, CSS3, JavaScript (ES6 modules)
- Service Worker (offline-first, cache version `v1.28.0`)
- LocalStorage (progress persistence)
- Google Fonts: Inter + Scheherazade New (Arabic)

## Project Structure

```
pwa/
├── index.html              # App shell
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── css/
│   ├── variables.css       # Design tokens (complete system)
│   ├── base.css            # Typography, resets, a11y
│   ├── components.css      # Shared UI components
│   ├── names.css           # Browse view
│   ├── memorization.css    # Flashcard + session UI
│   └── progress.css        # Dashboard UI
├── js/
│   ├── app.js              # Entry point, routing, PWA setup
│   ├── data.js             # Dataset loader
│   ├── ui.js               # Browse/modal/favorites renderer
│   ├── memorization.js     # SRS algorithm (intervals: 1/3/7/14/30d)
│   ├── progress.js         # localStorage tracker
│   ├── session.js          # Session controller
│   └── dashboard.js        # Progress dashboard
├── data/
│   └── names.json          # 99 names dataset (v1 — see CONTENT_STRATEGY.md)
└── assets/
    └── icons/              # icon.svg, icon-192.png, icon-512.png, maskable
```

## Local Development

```bash
# Serve locally (any method)
python3 -m http.server 8000
# or: npx serve

# Open http://localhost:8000
```

**Test PWA install:** DevTools → Application → Manifest → "Add to home screen"

## Deployment

Currently hosted on nurahmadfurlong.com. To deploy to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages), just push the contents of this directory — no build step required.

## Credits

- Names classification: Shaykh Muhammad ibn Salih al-Uthaymeen, *Al-Qawaa'id al-Muthlaa*
- Theological content: Al-Ghazali, *Al-Maqsad al-Asna*
- Arabic typography: Google Fonts — Scheherazade New
- Built with Claude Code + Codex (Feb 2026)

---

**Version:** 1.7.1 | **Last updated:** 2026-03-21
