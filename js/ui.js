/**
 * UI Module - Names of Allah PWA
 * Beautiful rendering of names with reverent design
 */

// Shared body scroll lock. iOS Safari ignores overflow: hidden on body, so we
// pin the body with position: fixed and restore the scroll offset on release.
// Counter-based: the video player can open on top of the name modal.
const scrollLock = {
  count: 0,
  y: 0,
};

export function lockBodyScroll() {
  if (scrollLock.count++ === 0) {
    scrollLock.y = window.scrollY;
    const { style } = document.body;
    style.position = 'fixed';
    style.top = `-${scrollLock.y}px`;
    style.left = '0';
    style.right = '0';
    style.width = '100%';
  }
}

export function unlockBodyScroll() {
  if (scrollLock.count === 0) return;
  if (--scrollLock.count === 0) {
    const { style } = document.body;
    style.position = '';
    style.top = '';
    style.left = '';
    style.right = '';
    style.width = '';
    window.scrollTo(0, scrollLock.y);
  }
}

export class UIRenderer {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.currentLanguage = localStorage.getItem('language') || 'en';
    this.quranAyahCache = this.loadQuranAyahCache();
  }

  loadQuranAyahCache() {
    try {
      return JSON.parse(localStorage.getItem('quran_ayah_ar_cache_v1') || '{}');
    } catch (error) {
      console.warn('Could not read Quran ayah cache:', error);
      return {};
    }
  }

  saveQuranAyahCache() {
    try {
      localStorage.setItem('quran_ayah_ar_cache_v1', JSON.stringify(this.quranAyahCache));
    } catch (error) {
      console.warn('Could not save Quran ayah cache:', error);
    }
  }

  parseQuranReference(reference) {
    if (!reference) return null;

    // Normalize Arabic-Indic digits so references parse consistently.
    const normalizedReference = String(reference)
      .replace(/[٠-٩]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'.indexOf(digit))
      .trim();

    const match = normalizedReference.match(/(\d+)\s*[:/]\s*(\d+)/);
    if (!match) {
      return {
        surah: null,
        ayah: null,
        verseKey: null,
        url: `https://quran.com/search/${encodeURIComponent(normalizedReference)}`,
        isDirectVerse: false,
      };
    }

    const surah = parseInt(match[1], 10);
    const ayah = parseInt(match[2], 10);
    const verseKey = `${surah}:${ayah}`;

    return {
      surah,
      ayah,
      verseKey,
      url: `https://quran.com/${surah}/${ayah}`,
      isDirectVerse: true,
    };
  }

  extractHadithCollectionHints(reference) {
    if (!reference) return [];

    const lowerRef = reference.toLowerCase();
    const hints = [];

    if (/(al-)?bukhaaree|bukhari/.test(lowerRef)) hints.push('bukhari');
    if (/muslim/.test(lowerRef)) hints.push('muslim');
    if (/(at-)?tirmidhee|tirmidhi/.test(lowerRef)) hints.push('tirmidhi');
    if (/abu\s*daawood|abu\s*dawud|abudawud/.test(lowerRef)) hints.push('abudawud');
    if (/ahmad/.test(lowerRef)) hints.push('ahmad');

    return hints;
  }

  buildSunnahUrl(name) {
    if (!name?.proof_hadith) return null;
    if (name.proof_hadith_url && /^https?:\/\/(www\.)?sunnah\.com\//i.test(name.proof_hadith_url)) {
      return name.proof_hadith_url;
    }

    const collectionHints = this.extractHadithCollectionHints(name.proof_hadith);
    const normalizedReference = name.proof_hadith
      .replace(/^reported by\s*/i, '')
      .replace(/[():]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const normalizedText = (name.proof_text || '')
      .replace(/…|\.\.\./g, ' ')
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\([^)]*\)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const snippetWords = normalizedText.split(/\s+/).filter(Boolean).slice(0, 24);
    const textSnippet = snippetWords.join(' ');

    const queryParts = [];
    if (collectionHints.length > 0) queryParts.push(collectionHints.join(' '));
    if (textSnippet.length >= 20) {
      queryParts.push(`"${textSnippet}"`);
    } else {
      queryParts.push(normalizedReference);
    }

    const query = queryParts.join(' ').trim();
    return `https://sunnah.com/search?q=${encodeURIComponent(query)}`;
  }

  async fetchQuranAyahArabic(verseKey) {
    if (this.quranAyahCache[verseKey]) {
      return this.quranAyahCache[verseKey];
    }

    const response = await fetch(
      `https://api.quran.com/api/v4/verses/by_key/${encodeURIComponent(verseKey)}?language=en&fields=text_uthmani,text_imlaei`
    );

    if (!response.ok) {
      throw new Error(`Quran API HTTP ${response.status}`);
    }

    const payload = await response.json();
    const verse = payload?.verse || payload?.data?.verse || payload?.result?.verse || payload?.result;
    const arabicText =
      verse?.text_uthmani ||
      verse?.text_imlaei ||
      verse?.text_uthmani_simple ||
      verse?.text_indopak;

    if (!arabicText) {
      throw new Error('No Arabic text found in Quran API response');
    }

    this.quranAyahCache[verseKey] = arabicText;
    this.saveQuranAyahCache();
    return arabicText;
  }

  async hydrateQuranEvidence(modal) {
    const evidenceNodes = Array.from(modal.querySelectorAll('.proof-arabic[data-verse-key]'));

    await Promise.all(evidenceNodes.map(async (node) => {
      const verseKey = node.dataset.verseKey;
      if (!verseKey) return;

      try {
        const arabicText = await this.fetchQuranAyahArabic(verseKey);
        node.textContent = arabicText;
        node.classList.remove('proof-arabic-fallback');
      } catch (error) {
        console.warn(`Unable to fetch Arabic ayah ${verseKey}:`, error);
        node.textContent = 'Arabic ayah unavailable here. Use Quran.com link.';
        node.classList.add('proof-arabic-fallback');
      }
    }));
  }

  renderNamesList(names, container) {
    if (!names || names.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p class="text-muted">No names found</p>
        </div>
      `;
      return;
    }

    const html = names.map(name => this.createNameCard(name)).join('');
    container.innerHTML = `<div class="names-grid">${html}</div>`;

    // Add click handlers
    container.querySelectorAll('.name-card').forEach(card => {
      card.addEventListener('click', () => {
        const index = card.dataset.index;
        this.showNameDetail(index);
      });
    });
  }

  createNameCard(name) {
    const meaning = this.currentLanguage === 'en'
      ? name.english_meaning
      : name.bahasa_meaning || name.english_meaning;

    const preview = name.aqeedah_belief
      ? name.aqeedah_belief.substring(0, 100) + '...'
      : name.when_to_invoke?.substring(0, 100) + '...' || '';

    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const isFavorite = favorites.includes(name.index);

    return `
      <article class="name-card" data-index="${name.index}">
        <span class="name-number">#${name.index}</span>
        ${this.dataManager.getVideosForName(name.index).length ? `
          <span class="video-badge" title="Has video lessons">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
            <span>Video</span>
          </span>
        ` : ''}
        <span class="source-badge ${name.source_type}">${name.source_type === 'quran' ? 'Quran' : 'Sunnah'}</span>
        ${isFavorite ? '<span class="favorite-badge" title="Favorited">⭐</span>' : ''}

        <div class="card-arabic" lang="ar" dir="rtl">${name.arabic}</div>

        <div class="card-meta">
          <h3 class="card-transliteration">${name.transliteration}</h3>
          <p class="card-meaning">${meaning}</p>
        </div>

        <div class="card-divider"></div>

        <p class="card-preview">${preview}</p>

        <button class="card-action" aria-label="Explore ${name.transliteration}">
          <span>Explore</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </article>
    `;
  }

  showNameDetail(index) {
    const name = this.dataManager.getNameByIndex(index);
    if (!name) return;

    const meaning = this.currentLanguage === 'en'
      ? name.english_meaning
      : name.bahasa_meaning || name.english_meaning;

    const description = this.currentLanguage === 'en'
      ? name.description_en
      : name.description_ms || name.description_en;
    const quranRefInfo = this.parseQuranReference(name.proof_quran);
    const sunnahRefUrl = this.buildSunnahUrl(name);

    // Parse references to find specific locators if present
    const refParts = name.source_reference ? name.source_reference.split(';').map(p => p.trim()) : [];
    // Keep only the page part ("p. 68-72"); the author and book are written out below
    const pageOf = (ref) => (ref.match(/p{1,2}\.\s*[\d\s,–-]+\d/i) || [''])[0].trim();
    const ghazaliRef = pageOf(refParts.find(p => p.toLowerCase().includes('ghazali') || p.toLowerCase().includes('maqsad')) || '');
    const jalilRef = pageOf(refParts.find(p => p.toLowerCase().includes('jalil') || p.toLowerCase().includes('جليل')) || '');

    // Rigorous academic verification auditing: only cite if an exact excerpt exists in the data
    let verificationHTML = '';
    const hasGhazaliQuote = name.ghazali_insight && 
                            !name.ghazali_insight.toLowerCase().includes('insufficient') && 
                            !name.ghazali_insight.toLowerCase().includes('none');

    const hasJalilQuote = name.al_jalil_commentary && 
                          !name.al_jalil_commentary.toLowerCase().includes('insufficient') && 
                          !name.al_jalil_commentary.toLowerCase().includes('none');

    const usedSources = [];
    if (name.proof_text) {
      usedSources.push(name.source_type === 'quran' ? `The Quran (${name.proof_quran})` : `Hadith (${name.proof_hadith})`);
    }
    if (hasGhazaliQuote) {
      usedSources.push(`Al-Ghazali, Al-Maqsad al-Asna${ghazaliRef ? `, ${ghazaliRef}` : ''}`);
    }
    if (hasJalilQuote) {
      usedSources.push(`Abdul Aziz Al-Jalil, ولله الأسماء الحسنى فادعوه بها${jalilRef ? `, ${jalilRef}` : ''}`);
    }

    if (name.proof_text || hasGhazaliQuote || hasJalilQuote) {
      verificationHTML = `
        <section class="detail-section verification-section">
          <details class="verification-details">
            <summary class="verification-summary">
              <span class="verification-title">📚 Sources Used</span>
              <span class="expander-arrow">▼</span>
            </summary>
            <div class="verification-content">
              <p class="verification-intro">The texts this entry draws on. <strong>Not yet checked by scholars.</strong></p>
              
              ${name.proof_text ? `
                <div class="verification-block">
                  <h4 class="cite-header">📜 Quran or Hadith (English translation):</h4>
                  <blockquote class="verification-quote scriptural-quote">
                    "${name.proof_text}"
                  </blockquote>
                  <p class="verification-quote-ref">— ${name.proof_quran || name.proof_hadith || ''}</p>
                </div>
              ` : ''}

              ${hasGhazaliQuote ? `
                <div class="verification-block">
                  <h4 class="cite-header">✨ Imam Al-Ghazali:</h4>
                  <blockquote class="verification-quote classical-quote">
                    "${name.ghazali_insight}"
                  </blockquote>
                  <p class="verification-quote-ref">— Abu Hamid al-Ghazali, <em>Al-Maqsad al-Asna</em> ${ghazaliRef ? `(${ghazaliRef})` : ''}</p>
                </div>
              ` : ''}

              ${hasJalilQuote ? `
                <div class="verification-block">
                  <h4 class="cite-header">💡 Shaykh Al-Jalil:</h4>
                  <blockquote class="verification-quote classical-quote">
                    "${name.al_jalil_commentary}"
                  </blockquote>
                  <p class="verification-quote-ref">— Abdul Aziz Al-Jalil, <em>ولله الأسماء الحسنى فادعوه بها</em> ${jalilRef ? `(${jalilRef})` : ''}</p>
                </div>
              ` : ''}

              <div class="scholarly-cite-block">
                <h4 class="cite-header">Source list:</h4>
                <ul class="cite-list">
                  ${name.proof_text ? `
                    <li><strong>${name.source_type === 'quran' ? 'The Quran' : 'Hadith'}:</strong> <em>${name.proof_quran || name.proof_hadith || ''}</em></li>
                  ` : ''}
                  ${hasGhazaliQuote ? `
                    <li><strong>Al-Ghazali:</strong> <em>Al-Maqsad al-Asna fi Sharh Ma'ani Asma' Allah al-Husna</em> (${ghazaliRef || 'page not recorded'})</li>
                  ` : ''}
                  ${hasJalilQuote ? `
                    <li><strong>Al-Jalil:</strong> <em>ولله الأسماء الحسنى فادعوه بها</em> (${jalilRef || 'page not recorded'})</li>
                  ` : ''}
                </ul>
              </div>
            </div>
          </details>
        </section>
      `;
    }

    // Video explanations (thumbnail first; the player loads only on tap)
    const videos = this.dataManager.getVideosForName(name.index);
    const explanations = videos.filter(video => video.kind === 'explanation');
    const dhikrVideos = videos.filter(video => video.kind === 'dhikr' && video.names.includes(name.index));
    const videosHTML = videos.length ? `
      <section class="detail-section video-section">
        ${explanations.length ? `
          <h3 class="section-title">▶️ Watch an Explanation</h3>
          ${this.renderVideoList(explanations, name.index, { sortByLength: true })}
        ` : ''}
        ${dhikrVideos.length ? `
          <h3 class="section-title video-group-title">📿 Use this Name in Dhikr</h3>
          <p class="video-group-intro">These lessons explain a morning and evening dhikr whose words contain this Name.</p>
          ${this.renderVideoList(dhikrVideos, name.index)}
        ` : ''}
      </section>
    ` : '';

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content">
        <header class="modal-header">
          <button class="btn-icon btn-close" aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <span class="source-badge ${name.source_type} modal-badge">
            ${name.source_type === 'quran' ? '📖 From the Quran' : '📿 From the Sunnah'}
          </span>
        </header>

        <div class="modal-body">
          <!-- Hero Section -->
          <div class="name-hero">
            <div class="hero-decoration">•</div>
            <div class="name-detail-arabic" lang="ar" dir="rtl">${name.arabic}</div>
            <div class="hero-decoration">•</div>
          </div>

          <div class="name-detail-meta">
            <p class="detail-transliteration">${name.transliteration}</p>
            <p class="detail-meaning">${meaning}</p>
          </div>

          <div class="section-divider"></div>

          ${videosHTML}

          ${name.proof_quran || name.proof_hadith ? `
            <section class="detail-section">
              <h3 class="section-title">📖 Evidence</h3>
              ${name.proof_quran ? `
                <blockquote class="proof-text proof-text-quran">
                  ${name.proof_text ? `<p class="proof-translation">${name.proof_text}</p>` : ''}
                  ${quranRefInfo?.verseKey ? `
                    <p class="proof-arabic" data-verse-key="${quranRefInfo.verseKey}" lang="ar" dir="rtl">
                      Loading Arabic ayah...
                    </p>
                  ` : ''}
                  <cite>
                    ${quranRefInfo?.url ? `
                      <a class="quran-link quran-ref-link" href="${quranRefInfo.url}" target="_blank" rel="noopener noreferrer">
                        ${name.proof_quran}
                      </a>
                    ` : `
                      <span>${name.proof_quran}</span>
                    `}
                    ${quranRefInfo?.url ? `
                      <a class="quran-link" href="${quranRefInfo.url}" target="_blank" rel="noopener noreferrer">
                        ${quranRefInfo.isDirectVerse ? 'Open on Quran.com' : 'Search on Quran.com'}
                      </a>
                    ` : ''}
                  </cite>
                </blockquote>
              ` : ''}
              ${name.proof_hadith ? `
                <blockquote class="proof-text">
                  ${name.proof_text ? `<p class="proof-translation">${name.proof_text}</p>` : ''}
                  <cite>
                    <span>${name.proof_hadith}</span>
                    ${sunnahRefUrl ? `
                      <a class="sunnah-link" href="${sunnahRefUrl}" target="_blank" rel="noopener noreferrer">
                        ${name.proof_hadith_url ? 'Open on Sunnah.com' : 'Find on Sunnah.com'}
                      </a>
                    ` : ''}
                  </cite>
                </blockquote>
              ` : ''}
            </section>
          ` : ''}

          ${name.aqeedah_belief ? `
            <section class="detail-section">
              <h3 class="section-title">💭 What to Believe</h3>
              <p class="section-content">${name.aqeedah_belief}</p>
            </section>
          ` : ''}

          ${name.when_to_invoke ? `
            <section class="detail-section">
              <h3 class="section-title">🤲 When to Invoke</h3>
              <p class="section-content">${name.when_to_invoke}</p>
            </section>
          ` : ''}

          ${name.salah_usage ? `
            <section class="detail-section">
              <h3 class="section-title">🕌 In Prayer</h3>
              <p class="section-content">${name.salah_usage}</p>
            </section>
          ` : ''}

          ${name.dua_usage ? `
            <section class="detail-section">
              <h3 class="section-title">🤲 In Dua</h3>
              <p class="section-content">${name.dua_usage}</p>
            </section>
          ` : ''}

          ${name.dhikr_usage ? `
            <section class="detail-section">
              <h3 class="section-title">📿 In Remembrance</h3>
              <p class="section-content">${name.dhikr_usage}</p>
            </section>
          ` : ''}

          ${hasGhazaliQuote ? `
            <section class="detail-section ghazali-section">
              <h3 class="section-title">✨ Imam Al-Ghazali's Insight</h3>
              <p class="section-content ghazali-text">${name.ghazali_insight}</p>
            </section>
          ` : ''}

          ${hasJalilQuote ? `
            <section class="detail-section jalil-section">
              <h3 class="section-title">💡 Shaykh Al-Jalil's Lesson</h3>
              <p class="section-content jalil-text">${name.al_jalil_commentary}</p>
            </section>
          ` : ''}

          ${description ? `
            <section class="detail-section">
              <h3 class="section-title">📚 Extended Description</h3>
              <p class="section-content">${description}</p>
            </section>
          ` : ''}

          ${verificationHTML}

          <footer class="detail-footer">
            <p class="source-attribution">
              <strong>Sources:</strong> ${usedSources.join('; ') || 'The Holy Quran'}
            </p>
          </footer>
        </div>

        <div class="modal-actions">
          <button class="btn btn-secondary btn-favorite" data-index="${name.index}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>Favorite</span>
          </button>
          <button class="btn btn-secondary btn-share">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            <span>Share</span>
          </button>
        </div>
      </div>
    `;

    // Add to DOM
    document.body.appendChild(modal);
    lockBodyScroll();

    // Trigger animation
    setTimeout(() => modal.classList.add('active'), 10);

    // Populate Arabic ayah text for Quran evidence blocks.
    this.hydrateQuranEvidence(modal);

    // Open a video in a player on top of the modal
    this.bindVideoRows(modal);

    // Set initial favorite button state
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const favoriteBtn = modal.querySelector('.btn-favorite');
    const isFavorite = favorites.includes(name.index);

    if (isFavorite) {
      favoriteBtn.classList.add('active');
      favoriteBtn.querySelector('span').textContent = 'Unfavorite';
    }

    // Event listeners
    const closeModal = () => {
      document.removeEventListener('keydown', handleKeyboard);
      modal.classList.remove('active');
      setTimeout(() => {
        document.body.removeChild(modal);
        unlockBodyScroll();
      }, 300);
    };

    modal.querySelector('.btn-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-overlay').addEventListener('click', closeModal);

    // Favorite button
    favoriteBtn.addEventListener('click', () => {
      this.toggleFavorite(name.index);
    });

    // Share button
    modal.querySelector('.btn-share').addEventListener('click', () => {
      this.shareName(name);
    });

    // Keyboard support
    const handleKeyboard = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleKeyboard);
  }

  // One compact video row. `currentIndex` hides the current Name from "Also covers".
  renderVideoRow(video, currentIndex = null) {
    // List every Name in the video, in title order, with the current Name in bold
    const namesList = video.names
      .map(i => {
        const translit = this.dataManager.getNameByIndex(i)?.transliteration;
        if (!translit) return null;
        return i === currentIndex ? `<strong>${translit}</strong>` : translit;
      })
      .filter(Boolean);
    const namesLabel = video.kind === 'dhikr' ? 'Names in this dhikr' : `One video, ${namesList.length} Names`;
    return `
      <button class="video-row" data-video-id="${video.id}" data-video-title="${video.title.replace(/"/g, '&quot;')}">
        <span class="video-row-thumb">
          <img src="https://i.ytimg.com/vi/${video.id}/mqdefault.jpg" alt="" loading="lazy">
          <span class="video-row-play" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </span>
        </span>
        <span class="video-row-text">
          ${video.topic ? `<span class="video-row-topic">${video.topic}</span>` : ''}
          <span class="video-row-speaker">${video.speaker}</span>
          <span class="video-row-detail">${video.kind === 'dhikr' ? 'SHIELD series' : (video.episode || `Part ${video.part}`)}${video.duration ? ` · ${video.duration}` : ''}</span>
          ${namesList.length > 1 ? `<span class="video-row-also">${namesLabel}: ${namesList.join(', ')}</span>` : ''}
          ${video.note ? `<span class="video-row-also video-note">${video.note}</span>` : ''}
        </span>
      </button>
    `;
  }

  // "1:05:30" -> 3930 seconds; unknown lengths sort last
  videoSeconds(video) {
    if (!video.duration) return Infinity;
    return video.duration.split(':').reduce((total, part) => total * 60 + Number(part), 0);
  }

  // Multi-part lessons share a topic once the part marker is removed:
  // "Aayat Al-Kursi (Part 2)", "Aayat Al-Kursi (4)", "Allah Is Enough For You (1/2)"
  videoPartKey(video) {
    if (!video.topic) return null;
    return video.topic.replace(/\s*\((?:part\s*)?\d+(?:\s*\/\s*\d+)?\)\s*$/i, '').trim().toLowerCase();
  }

  // Video rows with multi-part lessons collapsed behind a "Show all N parts" button.
  // sortByLength puts short videos first (used for explanations).
  renderVideoList(videos, currentIndex = null, { sortByLength = false } = {}) {
    const list = sortByLength
      ? [...videos].sort((a, b) => this.videoSeconds(a) - this.videoSeconds(b))
      : videos;

    const groups = [];
    const byKey = new Map();
    list.forEach(video => {
      const key = this.videoPartKey(video);
      if (key && byKey.has(key)) {
        byKey.get(key).push(video);
      } else {
        const group = [video];
        groups.push(group);
        if (key) byKey.set(key, group);
      }
    });

    return groups.map(group => {
      if (group.length === 1) return this.renderVideoRow(group[0], currentIndex);
      const [first, ...rest] = group;
      const label = group.length === 2 ? 'Show both parts' : `Show all ${group.length} parts`;
      return `
        <div class="video-parts">
          ${this.renderVideoRow(first, currentIndex)}
          <div class="video-parts-rest" hidden>
            ${rest.map(video => this.renderVideoRow(video, currentIndex)).join('')}
          </div>
          <button class="video-parts-toggle" aria-expanded="false" data-label="${label}">${label}</button>
        </div>
      `;
    }).join('');
  }

  bindVideoRows(container) {
    container.querySelectorAll('.video-row').forEach(row => {
      row.addEventListener('click', () => this.openVideoPlayer(row.dataset.videoId, row.dataset.videoTitle, row));
    });
    container.querySelectorAll('.video-parts-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const rest = btn.parentElement.querySelector('.video-parts-rest');
        const open = rest.hidden;
        rest.hidden = !open;
        btn.setAttribute('aria-expanded', String(open));
        btn.textContent = open ? 'Show fewer parts' : btn.dataset.label;
      });
    });
  }

  openVideoPlayer(videoId, title, returnFocusTo) {
    const player = document.createElement('div');
    player.className = 'video-player';
    player.setAttribute('role', 'dialog');
    player.setAttribute('aria-modal', 'true');
    player.setAttribute('aria-label', title);
    player.innerHTML = `
      <div class="video-player-backdrop"></div>
      <div class="video-player-box">
        <div class="video-player-bar">
          <p class="video-player-title">${title}</p>
          <button class="btn-icon video-player-close" aria-label="Close video">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <iframe class="video-player-frame"
          src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0"
          title="${title}"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowfullscreen></iframe>
      </div>
    `;
    document.body.appendChild(player);
    lockBodyScroll();
    requestAnimationFrame(() => player.classList.add('active'));

    // Capture Escape first so it closes only the video, not the Name modal too
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        close();
      }
    };
    const close = () => {
      window.removeEventListener('keydown', onKey, true);
      player.remove();
      unlockBodyScroll();
      returnFocusTo?.focus();
    };
    window.addEventListener('keydown', onKey, true);
    player.querySelector('.video-player-close').addEventListener('click', close);
    player.querySelector('.video-player-backdrop').addEventListener('click', close);
    player.querySelector('.video-player-close').focus();
  }

  toggleFavorite(index) {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const indexNum = parseInt(index);
    let isNowFavorite = false;

    if (favorites.includes(indexNum)) {
      const filtered = favorites.filter(i => i !== indexNum);
      localStorage.setItem('favorites', JSON.stringify(filtered));
      this.showToast('Removed from favorites');
      isNowFavorite = false;
    } else {
      favorites.push(indexNum);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      this.showToast('Added to favorites ⭐');
      isNowFavorite = true;
    }

    // Update modal button if open
    const btn = document.querySelector(`.btn-favorite[data-index="${index}"]`);
    if (btn) {
      if (isNowFavorite) {
        btn.classList.add('active');
        btn.querySelector('span').textContent = 'Unfavorite';
      } else {
        btn.classList.remove('active');
        btn.querySelector('span').textContent = 'Favorite';
      }
    }

    // Update browse view badge
    const card = document.querySelector(`.name-card[data-index="${index}"]`);
    if (card) {
      const existingBadge = card.querySelector('.favorite-badge');

      if (isNowFavorite && !existingBadge) {
        const sourceBadge = card.querySelector('.source-badge');
        sourceBadge.insertAdjacentHTML('afterend', '<span class="favorite-badge" title="Favorited">⭐</span>');
      } else if (!isNowFavorite && existingBadge) {
        existingBadge.remove();
      }
    }

    // If currently on favorites view, re-render
    const favoritesView = document.getElementById('favoritesView');
    if (favoritesView && !favoritesView.classList.contains('hidden')) {
      this.renderFavorites();
    }
  }

  async shareName(name) {
    // Build beautiful share text
    const lines = [
      `${name.arabic}`,
      `${name.transliteration}`,
      '',
      `"${name.english_meaning}"`,
    ];

    // Add Quran/Sunnah source if available
    if (name.proof_quran) {
      lines.push('', `📖 Quran: ${name.proof_quran}`);
    }
    if (name.proof_hadith) {
      lines.push(`📿 Hadith: ${name.proof_hadith}`);
    }

    // Add key insight
    if (name.aqeedah_belief) {
      lines.push('', name.aqeedah_belief);
    }

    lines.push('', '✨ From: Names of Allah App');

    const text = lines.join('\n');

    // Try native share
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name.transliteration} - Allah's Beautiful Name`,
          text: text,
        });
        this.showToast('Shared successfully! 🎉');
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
          this.fallbackCopyToClipboard(text);
        }
      }
    } else {
      this.fallbackCopyToClipboard(text);
    }
  }

  fallbackCopyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          this.showToast('Copied to clipboard! ✅');
        })
        .catch((err) => {
          console.error('Clipboard write failed:', err);
          this.showToast('Could not copy to clipboard', 'error');
        });
    } else {
      // Final fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand('copy');
        this.showToast('Copied to clipboard! ✅');
      } catch (err) {
        this.showToast('Could not copy to clipboard', 'error');
      }

      document.body.removeChild(textarea);
    }
  }

  showToast(message, type = 'success') {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto-remove after 3s
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  renderFavorites() {
    const favoritesList = document.getElementById('favoritesList');
    const emptyState = document.getElementById('favoritesEmpty');

    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

    if (favorites.length === 0) {
      favoritesList.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    favoritesList.classList.remove('hidden');
    emptyState.classList.add('hidden');

    // Get favorite names from data
    const favoriteNames = this.dataManager.getAllNames()
      .filter(name => favorites.includes(name.index));

    const meaning = (name) => this.currentLanguage === 'en'
      ? name.english_meaning
      : name.bahasa_meaning || name.english_meaning;

    favoritesList.innerHTML = favoriteNames.map(name => `
      <article class="name-card" data-index="${name.index}">
        <div class="name-card-header">
          <span class="name-number">#${name.index}</span>
          <button class="btn-icon btn-remove-favorite"
                  data-index="${name.index}"
                  aria-label="Remove from favorites"
                  title="Remove from favorites">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </button>
        </div>

        <div class="card-arabic" lang="ar" dir="rtl">${name.arabic}</div>

        <div class="card-meta">
          <h3 class="card-transliteration">${name.transliteration}</h3>
          <p class="card-meaning">${meaning(name)}</p>
        </div>

        <div class="card-divider"></div>

        <button class="card-action" data-index="${name.index}" aria-label="Explore ${name.transliteration}">
          <span>Explore</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </article>
    `).join('');

    // Attach event listeners
    favoritesList.querySelectorAll('.name-card').forEach(card => {
      const index = card.dataset.index;

      // Card click
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking remove button
        if (!e.target.closest('.btn-remove-favorite')) {
          this.showNameDetail(index);
        }
      });

      // Explore button
      const exploreBtn = card.querySelector('.card-action');
      if (exploreBtn) {
        exploreBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.showNameDetail(index);
        });
      }

      // Remove favorite button
      const removeBtn = card.querySelector('.btn-remove-favorite');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleFavorite(index);
        });
      }
    });
  }
}
