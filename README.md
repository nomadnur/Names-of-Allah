# Names of Allah PWA

A mobile-first Progressive Web App for learning and memorizing the 99 Beautiful Names of Allah (Asma'ul Husna), with authentic sources from the Quran and Sunnah.

**Live:** [nurahmadfurlong.com/names-of-allah](https://nurahmadfurlong.com/names-of-allah/)

---

## Current Status

### App (Stages 1–4 complete)

| Stage | Feature | Status |
|-------|---------|--------|
| 1 | Foundation — PWA shell, manifest, service worker, design system | ✅ Done |
| 2 | Browse mode — 99 names, detail modals, search, favorites | ✅ Done |
| 3 | Memorization mode — spaced repetition (SRS), flashcards, sessions | ✅ Done |
| 4 | Progress dashboard — 99-dot grid, stats, review queue | ✅ Done |
| 5 | Polish — dark mode, full a11y, share, Lighthouse 90+ | ⏳ Pending |

### Content (v1 — demo quality)

> **Important:** The current dataset (`data/names.json`) is a first-pass merge from three sources. It is functional but not production-ready. Several fields have gaps and scholarly depth is limited. See [`CONTENT_STRATEGY.md`](CONTENT_STRATEGY.md) for the enrichment roadmap.

| Field | Completeness | Notes |
|-------|-------------|-------|
| arabic | ✅ 99/99 | With tashkeel (diacritics) |
| transliteration | ✅ 99/99 | Uthaymeen romanisation |
| english_meaning | ✅ 99/99 | Concise |
| bahasa_meaning | ~65/99 | ~37 names missing |
| proof_quran | ~70% | References need verification |
| proof_hadith | ~20% | Low coverage |
| aqeedah_belief | ~80% | From Ghazali/Uthaymeen |
| when_to_invoke | ~65% | Practical guidance gaps |
| salah_usage | ~65% | Gaps |
| dhikr_usage | ~65% | Gaps |

---

## Tech Stack

- **Pure Web Standards** — no frameworks, no build tools
- HTML5, CSS3, JavaScript (ES6 modules)
- Service Worker (offline-first, cache version `v1.7.1-a11y`)
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
