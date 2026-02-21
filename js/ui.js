/**
 * UI Module - Names of Allah PWA
 * Beautiful rendering of names with reverent design
 */

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

          ${name.ghazali_insight ? `
            <section class="detail-section ghazali-section">
              <h3 class="section-title">✨ Imam Al-Ghazali's Insight</h3>
              <p class="section-content ghazali-text">${name.ghazali_insight}</p>
            </section>
          ` : ''}

          ${description ? `
            <section class="detail-section">
              <h3 class="section-title">📚 Extended Description</h3>
              <p class="section-content">${description}</p>
            </section>
          ` : ''}

          <footer class="detail-footer">
            <p class="source-attribution">
              <strong>Sources:</strong> ${name.source_reference}
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
    document.body.style.overflow = 'hidden';

    // Trigger animation
    setTimeout(() => modal.classList.add('active'), 10);

    // Populate Arabic ayah text for Quran evidence blocks.
    this.hydrateQuranEvidence(modal);

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
      modal.classList.remove('active');
      setTimeout(() => {
        document.body.removeChild(modal);
        document.body.style.overflow = '';
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
    modal.addEventListener('remove', () => {
      document.removeEventListener('keydown', handleKeyboard);
    });
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
