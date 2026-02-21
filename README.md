# Names of Allah PWA

A beautiful, mobile-first Progressive Web App for learning and memorizing the 99 Beautiful Names of Allah (Asma'ul Husna) with authentic sources from Quran and Sunnah.

## Features

- **📖 Authentic Sources**: Based on Shaykh Uthaymeen's classification (81 from Quran, 18 from Sunnah)
- **🧠 Spaced Repetition**: Scientifically proven memorization technique
- **🌙 Bilingual**: Full support for English and Bahasa Melayu
- **📱 Offline-First**: Install as PWA, works without internet
- **✨ Beautiful Design**: Calm, spiritual aesthetic with Arabic typography
- **📊 Progress Tracking**: Track your learning journey with detailed stats

## Tech Stack

- **Pure Web Standards**: No frameworks, no build tools
- HTML5, CSS3, JavaScript (ES6)
- Service Worker (offline support)
- LocalStorage (progress persistence)

## Project Structure

```
pwa/
├── index.html              # App shell
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── css/
│   ├── variables.css       # Design tokens
│   ├── base.css           # Typography, resets
│   └── components.css     # UI components
├── js/
│   └── app.js             # Main application
├── data/
│   └── names.json         # 99 names dataset (pending)
├── assets/
│   └── icons/             # PWA icons (pending)
└── README.md
```

## Getting Started

### Local Development

1. **Serve the app locally**:
   ```bash
   # Using Python 3
   python3 -m http.server 8000

   # Using Node.js (npx)
   npx serve

   # Using PHP
   php -S localhost:8000
   ```

2. **Open in browser**:
   ```
   http://localhost:8000
   ```

3. **Test PWA features**:
   - Open DevTools > Application > Service Workers
   - Check "Offline" to test offline mode
   - Use Lighthouse to audit PWA score

### Testing on Mobile

#### iOS (Safari)
1. Open the app in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. App will install with icon

#### Android (Chrome)
1. Open the app in Chrome
2. Tap the install prompt (or menu > Add to Home Screen)
3. App will install with icon

## Deployment

### Option 1: Netlify (Recommended)
1. Drag and drop the `pwa/` folder to [Netlify](https://app.netlify.com/)
2. Configure custom domain (optional)
3. HTTPS is automatic

### Option 2: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the `pwa/` directory
3. Follow prompts

### Option 3: GitHub Pages
1. Push to GitHub repository
2. Go to Settings > Pages
3. Select source branch
4. Access at `https://username.github.io/repo-name`

## Development Status

### ✅ Stage 1: Foundation (Complete)
- [x] Project structure
- [x] PWA manifest
- [x] Service worker (basic)
- [x] HTML app shell
- [x] Design system (CSS variables)
- [x] Base typography
- [x] Navigation drawer
- [x] Install prompt
- [x] Offline detection

### 🚧 Stage 2: Browse Mode (In Progress)
- [ ] Load names from JSON
- [ ] Display all 99 names
- [ ] Detail modal
- [ ] Search functionality
- [ ] Language toggle
- [ ] Favorites

### ⏳ Stage 3: Memorization Mode (Pending)
- [ ] Flashcard component
- [ ] Spaced repetition engine
- [ ] Progress tracking
- [ ] Session management

### ⏳ Stage 4: Progress Dashboard (Pending)
- [ ] Stats overview
- [ ] 99-dot progress grid
- [ ] Review queue
- [ ] Streak tracker

### ⏳ Stage 5: Polish (Pending)
- [ ] Dark mode
- [ ] Haptic feedback
- [ ] Share progress
- [ ] Accessibility improvements
- [ ] Performance optimization

## Data Requirements

The app requires `data/names.json` with this structure:

```json
[
  {
    "index": 1,
    "arabic": "ٱلرَّحْمَـٰنُ",
    "transliteration": "Ar-Rahman",
    "english_meaning": "The Most Compassionate",
    "bahasa_meaning": "Yang Maha Pengasih",
    "proof_quran": "Surah Ar-Rahman 55:1-2",
    "proof_hadith": null,
    "aqeedah_belief": "Allah's mercy encompasses all creation...",
    "salah_usage": "Recite before takbir",
    "dua_usage": "Call upon when seeking forgiveness",
    "dhikr_usage": "Repeat 33x after Fajr",
    "when_to_invoke": "After making mistakes",
    "source_reference": "Uthaymeen",
    "source_type": "quran"
  }
  // ... 98 more
]
```

Currently waiting for canonical dataset from data validation process.

## Design Tokens

### Colors
```css
--paper: #FDFCF9;          /* Warm off-white */
--ink: #1A1A1A;            /* Near-black */
--accent: #2D5F4F;         /* Deep teal (Islamic green) */
--gold: #C9A961;           /* Gold accent */
```

### Typography
```css
--font-arabic: 'Noto Naskh Arabic', serif;
--font-body: 'Inter', sans-serif;
```

### Spacing (8px base)
```css
--s-xs: 0.5rem;   /* 8px */
--s-sm: 1rem;     /* 16px */
--s-md: 1.5rem;   /* 24px */
--s-lg: 2rem;     /* 32px */
```

## Browser Support

- Chrome/Edge 90+ (Android/Desktop)
- Safari 14+ (iOS/macOS)
- Firefox 88+ (Desktop)

PWA features require HTTPS (except localhost).

## Contributing

This project follows the implementation plan in `PWA_IMPLEMENTATION_PLAN.md`.

## License

TBD

## Credits

- Based on Shaykh Muhammad ibn Salih al-Uthaymeen's *Al-Qawaa'id al-Muthlaa*
- Scholarly content from Al-Ghazali's *Al-Maqsad al-Asna*
- Typography: Google Fonts (Inter, Noto Naskh Arabic)

---

**Version**: 1.0.0 (Stage 1)
**Last Updated**: 2026-02-17
