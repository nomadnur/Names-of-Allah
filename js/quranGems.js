/**
 * Qur'an Gems Module - Names of Allah PWA
 * "Qur'an Gems": Surah grid -> Surah Ayahs & Names (Al-Biqa'i's Nazm al-Durar)
 * Mirrors the "Find Your Situation" drill-down UX.
 */

const escapeHtml = (text) => String(text ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function parseSurahAyah(nd) {
  const raw = String(nd?.ayah || '');
  const match = raw.match(/^(\d+):(\d+)/);
  const surahNum = match ? Number(match[1]) : 999;
  const ayahNum = match ? Number(match[2]) : 999;
  const ref = String(nd?.ayah_ref || '');
  const surahName = ref ? ref.replace(/\s+\d+:\d+.*$/, '').trim() : `Surah ${surahNum}`;
  return { surahNum, ayahNum, surahName, ayahKey: raw || `${surahNum}:${ayahNum}` };
}

export class QuranGemsView {
  constructor(dataManager, uiRenderer, container) {
    this.dataManager = dataManager;
    this.uiRenderer = uiRenderer;
    this.container = container;
    this.query = '';
    this.surahs = [];
  }

  buildGroups() {
    const names = this.dataManager.getAllNames().filter(n => n.nazm_al_durar_insight?.note);
    const surahMap = new Map();

    for (const name of names) {
      const nd = name.nazm_al_durar_insight;
      const { surahNum, ayahNum, surahName, ayahKey } = parseSurahAyah(nd);
      if (!surahMap.has(surahNum)) {
        surahMap.set(surahNum, {
          surahNum,
          surahName,
          ayahs: new Map(),
        });
      }
      const surahGroup = surahMap.get(surahNum);
      if (!surahGroup.ayahs.has(ayahKey)) {
        surahGroup.ayahs.set(ayahKey, {
          ayahKey,
          ayahNum,
          ayahRef: nd.ayah_ref || `Ayah ${ayahKey}`,
          ayahArabic: nd.ayah_arabic || '',
          ayahTranslation: nd.ayah_translation || '',
          ayahUrl: nd.ayah_url || '',
          entries: [],
        });
      }
      surahGroup.ayahs.get(ayahKey).entries.push({ name, nd });
    }

    this.surahs = Array.from(surahMap.values())
      .sort((a, b) => a.surahNum - b.surahNum)
      .map(s => ({
        ...s,
        ayahList: Array.from(s.ayahs.values()).sort((a, b) => a.ayahNum - b.ayahNum),
      }));
    return this.surahs;
  }

  render() {
    if (!this.container) return;
    this.buildGroups();
    this.renderSurahs();
  }

  renderSurahs() {
    const surahs = this.surahs;
    const totalEntries = surahs.reduce(
      (sum, s) => sum + s.ayahList.reduce((aSum, a) => aSum + a.entries.length, 0),
      0
    );

    this.container.innerHTML = `
      <div class="browse-header" style="margin-bottom: var(--space-5);">
        <div>
          <h2>Qur'an Gems</h2>
          <p class="text-secondary" style="margin-top: var(--space-1); margin-bottom: 0;">${totalEntries} verse-context insights across ${surahs.length} Surahs from Al-Biqa'i's <em>Nazm al-Durar</em>. Pick a Surah to explore.</p>
        </div>
        <div class="search-wrapper">
          <label for="gemsSearch" class="sr-only">Search Qur'an Gems</label>
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input id="gemsSearch" type="search" placeholder="Search Surah, Ayah, Name, or insight…" autocomplete="off" spellcheck="false" value="${escapeHtml(this.query)}">
        </div>
      </div>
      <div id="gemsBody"></div>
    `;

    const bodyEl = this.container.querySelector('#gemsBody');
    const draw = () => {
      const q = this.query.toLowerCase();
      if (!q) {
        const cards = surahs.map(s => {
          const allNames = s.ayahList.flatMap(a => a.entries.map(e => e.name.transliteration));
          const preview = allNames.length > 4
            ? `${allNames.slice(0, 4).join(', ')} +${allNames.length - 4} more`
            : allNames.join(', ');
          const ayahCount = s.ayahList.length;
          return `
            <button type="button" class="situation-category" data-surah="${s.surahNum}">
              <span class="situation-category-title">${s.surahNum}. ${escapeHtml(s.surahName)}</span>
              <span class="situation-category-covers">${escapeHtml(preview)}</span>
              <span class="situation-category-meta">
                ${allNames.length} ${allNames.length === 1 ? 'Name' : 'Names'} · ${ayahCount} ${ayahCount === 1 ? 'Ayah' : 'Ayahs'}
              </span>
            </button>
          `;
        }).join('');
        bodyEl.innerHTML = `<div class="situation-category-grid">${cards}</div>`;
        bodyEl.querySelectorAll('.situation-category[data-surah]').forEach(btn => {
          btn.addEventListener('click', () => this.renderSurahDetail(Number(btn.dataset.surah)));
        });
        return;
      }

      const matchedSurahs = surahs
        .map(s => {
          const ayahList = s.ayahList
            .map(a => {
              const ayahMatches =
                s.surahName.toLowerCase().includes(q) ||
                String(s.surahNum) === q ||
                a.ayahKey.includes(q) ||
                a.ayahTranslation.toLowerCase().includes(q) ||
                a.ayahArabic.includes(this.query);
              if (ayahMatches) return a;
              const entries = a.entries.filter(({ name, nd }) =>
                name.transliteration.toLowerCase().includes(q) ||
                name.english_meaning.toLowerCase().includes(q) ||
                name.arabic.includes(this.query) ||
                nd.note.toLowerCase().includes(q)
              );
              return entries.length ? { ...a, entries } : null;
            })
            .filter(Boolean);
          return ayahList.length ? { ...s, ayahList } : null;
        })
        .filter(Boolean);

      if (!matchedSurahs.length) {
        bodyEl.innerHTML = '<p class="text-muted">No Qur\'an Gems match your search.</p>';
        return;
      }

      bodyEl.innerHTML = matchedSurahs.map(s => `
        <section class="gems-surah-group">
          <header class="gems-surah-header">
            <h3 class="gems-surah-title">${s.surahNum}. ${escapeHtml(s.surahName)}</h3>
            <span class="gems-surah-count">${s.ayahList.reduce((sum, a) => sum + a.entries.length, 0)} matches</span>
          </header>
          <div class="gems-ayah-list">
            ${s.ayahList.map(ayah => this.renderAyah(ayah)).join('')}
          </div>
        </section>
      `).join('');
      this.bindNamePills(bodyEl);
    };

    const searchInput = this.container.querySelector('#gemsSearch');
    let timer;
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        this.query = searchInput.value.trim();
        draw();
      }, 200);
    });

    draw();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderSurahDetail(surahNum, highlightAyahKey = '') {
    const surah = this.surahs.find(s => s.surahNum === surahNum);
    if (!surah) return;

    const entryCount = surah.ayahList.reduce((sum, a) => sum + a.entries.length, 0);
    const ayahCount = surah.ayahList.length;

    this.container.innerHTML = `
      <button type="button" class="btn-text situations-back" id="gemsBack">← All Surahs</button>
      <div class="situations-header">
        <p class="situation-eyebrow">Surah ${surah.surahNum}</p>
        <h2>${escapeHtml(surah.surahName)}</h2>
        <p class="text-secondary">${entryCount} ${entryCount === 1 ? 'Name' : 'Names'} across ${ayahCount} ${ayahCount === 1 ? 'Ayah' : 'Ayahs'}.</p>
      </div>
      <div class="gems-ayah-list" style="padding-bottom: var(--space-12);">
        ${surah.ayahList.map(ayah => this.renderAyah(ayah, ayah.ayahKey === highlightAyahKey)).join('')}
      </div>
    `;

    this.container.querySelector('#gemsBack').addEventListener('click', () => this.renderSurahs());
    this.bindNamePills(this.container);
    if (highlightAyahKey) {
      const target = this.container.querySelector(`[data-ayah-key="${CSS.escape(highlightAyahKey)}"]`);
      if (target) {
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  bindNamePills(root) {
    root.querySelectorAll('.gems-name-pill[data-index]').forEach(btn => {
      btn.addEventListener('click', () => this.uiRenderer.showNameDetail(btn.dataset.index));
    });
  }

  renderAyah(ayah, highlight = false) {
    return `
      <article class="gems-ayah-card ${highlight ? 'gems-ayah-card-highlight' : ''}" data-ayah-key="${escapeHtml(ayah.ayahKey)}">
        <div class="gems-ayah-top">
          <span class="gems-ayah-ref">${escapeHtml(ayah.ayahRef)}</span>
          ${ayah.ayahUrl ? `<a class="quran-link" href="${escapeHtml(ayah.ayahUrl)}" target="_blank" rel="noopener noreferrer">Open on Quran.com</a>` : ''}
        </div>
        ${ayah.ayahArabic ? `<p class="proof-arabic gems-ayah-arabic" lang="ar" dir="rtl">${escapeHtml(ayah.ayahArabic)}</p>` : ''}
        ${ayah.ayahTranslation ? `<p class="proof-translation gems-ayah-translation">${escapeHtml(ayah.ayahTranslation)}</p>` : ''}
        <div class="gems-entries">
          ${ayah.entries.map(({ name, nd }) => `
            <div class="gems-entry">
              <div class="gems-entry-head">
                <button type="button" class="gems-name-pill" data-index="${name.index}">
                  <span class="gems-name-ar" lang="ar" dir="rtl">${escapeHtml(name.arabic)}</span>
                  <span class="gems-name-translit">${escapeHtml(name.transliteration)}</span>
                  <span class="gems-name-meaning">· ${escapeHtml(name.english_meaning)}</span>
                </button>
              </div>
              <p class="gems-entry-note">${escapeHtml(nd.note)}</p>
              <p class="gems-entry-meta">
                ${nd.turath_url
                  ? `<a href="${escapeHtml(nd.turath_url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(nd.source_attribution || `Turath ${nd.turath_ref || '9098'}`)}</a>`
                  : escapeHtml(nd.source_attribution || '')}
              </p>
            </div>
          `).join('')}
        </div>
      </article>
    `;
  }
}
