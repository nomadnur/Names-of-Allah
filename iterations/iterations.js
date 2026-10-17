/**
 * Names of Allah PWA — Homepage Iterations Controller (iterations.js)
 * Connects the 4 compact homepage designs (V1–V4 + Baseline) to the real
 * DataManager, UIRenderer, SituationsView, VideoGallery, SessionController,
 * and ProgressDashboard without modifying the parent PWA files.
 */

import { DataManager } from '../js/data.js';
import { UIRenderer } from '../js/ui.js';
import { SessionController } from '../js/session.js';
import { ProgressDashboard } from '../js/dashboard.js';
import { SituationsView } from '../js/situations.js';
import { VideoGallery } from '../js/gallery.js';

// ==================== Theme Management ====================
function getSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(theme) {
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const moon = btn?.querySelector('.icon-moon');
  const sun = btn?.querySelector('.icon-sun');

  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
    if (moon) moon.style.display = 'none';
    if (sun) sun.style.display = '';
    if (btn) btn.setAttribute('aria-label', 'Switch to light mode');
  } else if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
    if (moon) moon.style.display = '';
    if (sun) sun.style.display = 'none';
    if (btn) btn.setAttribute('aria-label', 'Switch to dark mode');
  } else {
    root.removeAttribute('data-theme');
    const isDark = getSystemDark();
    if (moon) moon.style.display = isDark ? 'none' : '';
    if (sun) sun.style.display = isDark ? '' : 'none';
    if (btn) btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
}

function toggleTheme() {
  const current = localStorage.getItem('theme') || 'auto';
  const isDark = current === 'dark' || (current === 'auto' && getSystemDark());
  const next = isDark ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme(next);
}

applyTheme(localStorage.getItem('theme') || 'auto');

// ==================== Core App Instances ====================
const dataManager = new DataManager();
const uiRenderer = new UIRenderer(dataManager);
let sessionController = null;
let progressDashboard = null;
const situationsView = new SituationsView(
  dataManager,
  uiRenderer,
  document.getElementById('situationsContent')
);
const videoGallery = new VideoGallery(
  dataManager,
  uiRenderer,
  document.getElementById('videosContent')
);

// Curated spotlight pool (Names with rich Salah, Du'a, Al-Ghazali, and Video content)
const SPOTLIGHT_INDICES = [54, 90, 32, 79, 24, 43, 30, 1, 47, 85];
let v1SpotlightPos = 0;
let v2SpotlightPos = 1; // Starts on #90 Ash-Shaafee in V2
let v4SpotlightPos = 0; // Starts on #54 Al-Qareeb in V4
let v2ActiveLens = 'when_to_invoke';
let v4ActiveLens = 'meaning';

// ==================== Navigation & View Switching ====================
const elements = {
  menuToggle: document.getElementById('menuToggle'),
  navDrawer: document.getElementById('navDrawer'),
  navOverlay: document.getElementById('navOverlay'),
  navClose: document.getElementById('navClose'),
  navLinks: document.querySelectorAll('.nav-link'),
  views: document.querySelectorAll('.view'),
  headerHomeLink: document.getElementById('headerHomeLink'),
};

function openNav() {
  elements.navDrawer?.setAttribute('aria-hidden', 'false');
  elements.menuToggle?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeNav() {
  elements.navDrawer?.setAttribute('aria-hidden', 'true');
  elements.menuToggle?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

export async function switchView(viewName, options = {}) {
  elements.views.forEach((v) => v.classList.add('hidden'));
  const target = document.getElementById(`${viewName}View`);
  if (target) target.classList.remove('hidden');

  elements.navLinks.forEach((link) => {
    link.classList.toggle('active', link.dataset.view === viewName);
  });

  if (viewName === 'welcome') {
    hydrateLiveStats();
  }

  if (viewName === 'browse') {
    const namesList = document.getElementById('namesList');
    const searchInput = document.getElementById('searchInput');
    const searchCount = document.getElementById('searchCount');
    const allNames = dataManager.getAllNames();

    if (options.filterType === 'quran') {
      const filtered = allNames.filter((n) => n.source_type === 'quran');
      uiRenderer.renderNamesList(filtered, namesList);
      if (searchCount) {
        searchCount.textContent = `Showing ${filtered.length} Quranic Names`;
        searchCount.classList.remove('hidden');
      }
    } else if (options.filterType === 'sunnah') {
      const filtered = allNames.filter((n) => n.source_type === 'sunnah');
      uiRenderer.renderNamesList(filtered, namesList);
      if (searchCount) {
        searchCount.textContent = `Showing ${filtered.length} Sunnah Names`;
        searchCount.classList.remove('hidden');
      }
    } else if (options.filterType === 'videos') {
      const filtered = allNames.filter((n) => dataManager.getVideosForName(n.index).length > 0);
      uiRenderer.renderNamesList(filtered, namesList);
      if (searchCount) {
        searchCount.textContent = `Showing ${filtered.length} Names with Video Lessons`;
        searchCount.classList.remove('hidden');
      }
    } else if (options.query !== undefined) {
      if (searchInput) searchInput.value = options.query;
      const results = options.query ? dataManager.searchNames(options.query) : allNames;
      uiRenderer.renderNamesList(results, namesList);
      if (searchCount) {
        if (options.query) {
          searchCount.textContent = `${results.length} of 99 names`;
          searchCount.classList.remove('hidden');
        } else {
          searchCount.classList.add('hidden');
        }
      }
    }
  }

  if (viewName === 'memorize' && sessionController) {
    sessionController.init();
  }

  if (viewName === 'favorites') {
    uiRenderer.renderFavorites();
  }

  if (viewName === 'situations') {
    await situationsView.load();
    if (options.situationId) {
      situationsView.renderSituation(options.situationId);
    } else if (options.categoryId) {
      situationsView.renderCategory(options.categoryId);
    } else {
      situationsView.renderCategories();
    }
  }

  if (viewName === 'videos') {
    if (options.videoQuery !== undefined) {
      videoGallery.query = options.videoQuery;
    }
    videoGallery.render();
  }

  if (viewName === 'progress' && progressDashboard) {
    progressDashboard.render();
  }

  closeNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== Iteration Switcher (V1 / V2 / V3 / V4 / Baseline) ====================
function switchIteration(iterKey) {
  const panes = document.querySelectorAll('.iter-pane');
  const tabs = document.querySelectorAll('.iter-tab[data-iter]');
  if (!panes.length) return;

  panes.forEach((pane) => {
    pane.classList.toggle('active', pane.dataset.iterPane === iterKey);
  });

  tabs.forEach((tab) => {
    const active = tab.dataset.iter === iterKey;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });

  // Always bring user back to the welcomeView when clicking an iteration tab
  const welcomeView = document.getElementById('welcomeView');
  if (welcomeView && welcomeView.classList.contains('hidden')) {
    switchView('welcome');
  }

  // Update URL query param without reload so links are shareable
  const url = new URL(window.location.href);
  url.searchParams.set('iter', iterKey);
  window.history.replaceState({}, '', url);
}

// ==================== Live Data Hydration for Spotlights & Stats ====================
function hydrateLiveStats() {
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  let mastered = 0;
  let learning = 0;
  let streak = 0;

  if (sessionController?.progress) {
    const stats = sessionController.progress.getStatistics();
    mastered = stats.mastered || 0;
    learning = stats.learning || 0;
    streak = stats.streak || 0;
  }

  document.querySelectorAll('[data-stat="favorites-count"]').forEach((el) => {
    el.textContent = String(favorites.length);
  });
  document.querySelectorAll('[data-stat="mastered-count"]').forEach((el) => {
    el.textContent = String(mastered);
  });
  document.querySelectorAll('[data-stat="learning-count"]').forEach((el) => {
    el.textContent = String(learning);
  });
  document.querySelectorAll('[data-stat="streak-count"]').forEach((el) => {
    el.textContent = String(streak);
  });
}

function renderV1Spotlight() {
  const index = SPOTLIGHT_INDICES[v1SpotlightPos % SPOTLIGHT_INDICES.length];
  const name = dataManager.getNameByIndex(index);
  if (!name) return;

  const videos = dataManager.getVideosForName(name.index);
  const elTranslit = document.getElementById('v1SpotTranslit');
  const elMeaning = document.getElementById('v1SpotMeaning');
  const elInvoke = document.getElementById('v1SpotInvoke');
  const elArabic = document.getElementById('v1SpotArabic');
  const elRef = document.getElementById('v1SpotRef');
  const elExplore = document.getElementById('v1SpotExplore');

  if (elTranslit) elTranslit.textContent = `#${name.index} ${name.transliteration}`;
  if (elMeaning) elMeaning.textContent = name.english_meaning;
  if (elInvoke) elInvoke.textContent = name.when_to_invoke || name.aqeedah_belief || '';
  if (elArabic) elArabic.textContent = name.arabic;
  if (elRef) {
    const src = name.proof_quran || name.proof_hadith || 'Authentic Source';
    elRef.textContent = `${src}${videos.length ? ` · ${videos.length} video${videos.length > 1 ? 's' : ''}` : ''}`;
  }
  if (elExplore) elExplore.dataset.openName = String(name.index);
}

function renderV2Spotlight() {
  const index = SPOTLIGHT_INDICES[v2SpotlightPos % SPOTLIGHT_INDICES.length];
  const name = dataManager.getNameByIndex(index);
  if (!name) return;

  const elTranslit = document.getElementById('v2SpotTranslit');
  const elMeaning = document.getElementById('v2SpotMeaning');
  const elArabic = document.getElementById('v2SpotArabic');
  const elLensBox = document.getElementById('v2SpotLensBox');
  const elExplore = document.getElementById('v2SpotExplore');

  if (elTranslit) elTranslit.textContent = `#${name.index} ${name.transliteration}`;
  if (elMeaning) elMeaning.textContent = name.english_meaning;
  if (elArabic) elArabic.textContent = name.arabic;
  if (elExplore) elExplore.dataset.openName = String(name.index);

  if (elLensBox) {
    const lensMap = {
      when_to_invoke: name.when_to_invoke || name.aqeedah_belief,
      in_salah: name.in_salah || name.aqeedah_belief,
      in_dua: name.in_dua || name.when_to_invoke,
      al_ghazali: name.al_ghazali_insight || name.description_en,
    };
    elLensBox.textContent = lensMap[v2ActiveLens] || name.english_meaning;
  }
}

function renderV4Spotlight() {
  const index = SPOTLIGHT_INDICES[v4SpotlightPos % SPOTLIGHT_INDICES.length];
  const name = dataManager.getNameByIndex(index);
  if (!name) return;

  const elArabic = document.getElementById('v4SpotArabic');
  const elTranslit = document.getElementById('v4SpotTranslit');
  const elMeaning = document.getElementById('v4SpotMeaning');
  const elBody = document.getElementById('v4SpotLensBody');
  const elExplore = document.getElementById('v4SpotExplore');
  const elRef = document.getElementById('v4SpotRef');

  if (elArabic) elArabic.textContent = name.arabic;
  if (elTranslit) elTranslit.textContent = `#${name.index} ${name.transliteration}`;
  if (elMeaning) elMeaning.textContent = name.english_meaning;
  if (elExplore) elExplore.dataset.openName = String(name.index);
  if (elRef) elRef.textContent = name.proof_quran || name.proof_hadith || '';

  if (elBody) {
    const lensMap = {
      meaning: name.aqeedah_belief || name.description_en,
      salah: name.in_salah || name.aqeedah_belief,
      dua: name.in_dua || name.when_to_invoke,
      ghazali: name.al_ghazali_insight || name.description_en,
    };
    elBody.textContent = lensMap[v4ActiveLens] || name.english_meaning;
  }
}

// ==================== Instant Homepage Search (Names + Situations) ====================
function setupHomepageQuickSearch(inputId, dropdownId) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;

  const renderMatches = (rawQuery) => {
    const q = rawQuery.trim().toLowerCase();
    if (!q) {
      dropdown.classList.add('hidden');
      dropdown.innerHTML = '';
      return;
    }

    const nameMatches = dataManager.searchNames(q).slice(0, 5);
    const sitMatches = (situationsView.situations || [])
      .filter((s) => s.title.toLowerCase().includes(q))
      .slice(0, 3);

    if (!nameMatches.length && !sitMatches.length) {
      dropdown.innerHTML = `
        <div class=" p-sm text-sm text-muted">No exact match for "${rawQuery}". Try "mercy", "anxious", "cure", or "Razzaq".</div>
      `;
      dropdown.classList.remove('hidden');
      return;
    }

    const nameItemsHtml = nameMatches
      .map(
        (n) => `
        <button type="button" class="v1-search-result-item" data-search-name="${n.index}">
          <span class="v1-search-result-left">
            <span class="v1-search-result-num">#${n.index}</span>
            <span>
              <span class="v1-search-result-title">${n.transliteration}</span>
              <span class="v1-search-result-sub"> — ${n.english_meaning}</span>
            </span>
          </span>
          <span class="v1-search-result-ar" lang="ar" dir="rtl">${n.arabic}</span>
        </button>
      `
      )
      .join('');

    const sitItemsHtml = sitMatches
      .map(
        (s) => `
        <button type="button" class="v1-search-result-item" data-search-sit="${s.id}">
          <span class="v1-search-result-left">
            <span class="v1-search-result-num">🧭 Situation</span>
            <span class="v1-search-result-title">${s.title}</span>
          </span>
          <span class="text-xs text-muted">${s.names.length} Names →</span>
        </button>
      `
      )
      .join('');

    dropdown.innerHTML = `
      ${sitItemsHtml}
      ${nameItemsHtml}
      <button type="button" class="v1-search-result-item" data-search-all="${rawQuery.replace(/"/g, '&quot;')}">
        <span class="v1-search-result-title" style="color: var(--color-primary)">See all results for "${rawQuery}" in Browse →</span>
      </button>
    `;
    dropdown.classList.remove('hidden');

    dropdown.querySelectorAll('[data-search-name]').forEach((btn) => {
      btn.addEventListener('click', () => {
        dropdown.classList.add('hidden');
        uiRenderer.showNameDetail(Number(btn.dataset.searchName));
      });
    });

    dropdown.querySelectorAll('[data-search-sit]').forEach((btn) => {
      btn.addEventListener('click', () => {
        dropdown.classList.add('hidden');
        switchView('situations', { situationId: btn.dataset.searchSit });
      });
    });

    dropdown.querySelectorAll('[data-search-all]').forEach((btn) => {
      btn.addEventListener('click', () => {
        dropdown.classList.add('hidden');
        switchView('browse', { query: btn.dataset.searchAll });
      });
    });
  };

  input.addEventListener('input', () => renderMatches(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      dropdown.classList.add('hidden');
      switchView('browse', { query: input.value.trim() });
    } else if (e.key === 'Escape') {
      dropdown.classList.add('hidden');
    }
  });

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });
}

// ==================== Hadith Narrations (Compact + Baseline) ====================
const HADITH_NARRATIONS = [
  {
    ref: 'Sahih al-Bukhari 7392',
    url: 'https://sunnah.com/bukhari:7392',
    ar: 'إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا مِائَةً إِلاَّ وَاحِدًا، مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ',
    arWord: 'أَحْصَاهَا',
    en: 'Allah has ninety-nine Names, one-hundred less one; and he who memorized them all by heart will enter Paradise.',
    enKey: 'memorized them all by heart',
  },
  {
    ref: 'Sahih al-Bukhari 2736',
    url: 'https://sunnah.com/bukhari:2736',
    ar: 'إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمَا مِائَةً إِلاَّ وَاحِدًا مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ',
    arWord: 'أَحْصَاهَا',
    en: 'Allah has ninety-nine names, i.e. one-hundred minus one, and whoever knows them will go to Paradise.',
    enKey: 'knows them',
  },
  {
    ref: 'Sahih Muslim 2677b',
    url: 'https://sunnah.com/muslim:2677b',
    ar: 'إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا مِائَةً إِلاَّ وَاحِدًا مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ',
    arWord: 'أَحْصَاهَا',
    en: 'Verily, there are ninety-nine names for Allah, i. e. hundred excepting one. He who enumerates them would get into Paradise.',
    enKey: 'enumerates them',
  },
  {
    ref: 'Sahih al-Bukhari 6410',
    url: 'https://sunnah.com/bukhari:6410',
    ar: 'لِلَّهِ تِسْعَةٌ وَتِسْعُونَ اسْمًا، مِائَةٌ إِلاَّ وَاحِدًا، لاَ يَحْفَظُهَا أَحَدٌ إِلاَّ دَخَلَ الْجَنَّةَ، وَهْوَ وَتْرٌ يُحِبُّ الْوَتْرَ',
    arWord: 'يَحْفَظُهَا',
    en: "Allah has ninety-nine Names, i.e., one hundred minus one, and whoever believes in their meanings and acts accordingly, will enter Paradise; and Allah is witr (one) and loves 'the witr' (i.e., odd numbers)",
    enKey: 'believes in their meanings and acts accordingly',
  },
];

function setupCompactHadithBars() {
  document.querySelectorAll('[data-hadith-widget]').forEach((widget) => {
    const enEl = widget.querySelector('[data-hadith-en]');
    const arEl = widget.querySelector('[data-hadith-ar]');
    const refEl = widget.querySelector('[data-hadith-ref]');
    const pills = widget.querySelectorAll('[data-narration-idx]');

    pills.forEach((pill) => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(pill.dataset.narrationIdx) || 0;
        const n = HADITH_NARRATIONS[idx];
        if (!n) return;
        pills.forEach((p) => p.classList.toggle('active', p === pill));
        if (enEl) {
          enEl.innerHTML = `“${n.en.replace(n.enKey, `<mark class="hadith-key">${n.enKey}</mark>`)}”`;
        }
        if (arEl) {
          arEl.innerHTML = n.ar.replace(n.arWord, `<mark class="hadith-key">${n.arWord}</mark>`);
        }
        if (refEl) {
          refEl.innerHTML = `<a href="${n.url}" target="_blank" rel="noopener noreferrer">${n.ref} ↗</a>`;
        }
      });
    });
  });
}

// ==================== Global Delegated Actions ====================
function bindInteractiveActions() {
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  elements.menuToggle?.addEventListener('click', openNav);
  elements.navOverlay?.addEventListener('click', closeNav);
  elements.navClose?.addEventListener('click', closeNav);

  elements.navLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(link.dataset.view);
    });
  });

  elements.headerHomeLink?.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('welcome');
  });

  // Top Iteration Studio Switcher Tabs
  document.querySelectorAll('.iter-tab[data-iter]').forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      switchIteration(tab.dataset.iter);
    });
  });

  // Delegated click listener for all homepage cards, chips, videos, and actions
  document.addEventListener('click', (e) => {
    // 1. Open Name Detail Modal
    const nameTrigger = e.target.closest('[data-open-name]');
    if (nameTrigger) {
      e.preventDefault();
      e.stopPropagation();
      uiRenderer.showNameDetail(Number(nameTrigger.dataset.openName));
      return;
    }

    // 2. Open Specific Situation in SituationsView
    const sitTrigger = e.target.closest('[data-open-situation]');
    if (sitTrigger) {
      e.preventDefault();
      switchView('situations', { situationId: sitTrigger.dataset.openSituation });
      return;
    }

    // 3. Open Specific Category in SituationsView
    const catTrigger = e.target.closest('[data-open-category]');
    if (catTrigger) {
      e.preventDefault();
      switchView('situations', { categoryId: catTrigger.dataset.openCategory });
      return;
    }

    // 4. Open YouTube Video Player Modal directly
    const videoTrigger = e.target.closest('[data-open-video]');
    if (videoTrigger) {
      e.preventDefault();
      uiRenderer.openVideoPlayer(
        videoTrigger.dataset.openVideo,
        videoTrigger.dataset.videoTitle || 'Video Lesson',
        videoTrigger
      );
      return;
    }

    // 5. Switch to a main PWA View (with optional filter/query)
    const viewTrigger = e.target.closest('[data-switch-view]');
    if (viewTrigger) {
      e.preventDefault();
      switchView(viewTrigger.dataset.switchView, {
        filterType: viewTrigger.dataset.filterType,
        query: viewTrigger.dataset.filterQuery,
        videoQuery: viewTrigger.dataset.videoQuery,
      });
      return;
    }
  });

  // Spotlight shufflers
  document.getElementById('v1ShuffleBtn')?.addEventListener('click', () => {
    v1SpotlightPos = (v1SpotlightPos + 1) % SPOTLIGHT_INDICES.length;
    renderV1Spotlight();
  });

  document.getElementById('v2ShuffleBtn')?.addEventListener('click', () => {
    v2SpotlightPos = (v2SpotlightPos + 1) % SPOTLIGHT_INDICES.length;
    renderV2Spotlight();
  });

  document.getElementById('v4ShuffleBtn')?.addEventListener('click', () => {
    v4SpotlightPos = (v4SpotlightPos + 1) % SPOTLIGHT_INDICES.length;
    renderV4Spotlight();
  });

  // V2 Worship Lens Pills
  document.querySelectorAll('[data-v2-lens]').forEach((pill) => {
    pill.addEventListener('click', () => {
      v2ActiveLens = pill.dataset.v2Lens;
      document.querySelectorAll('[data-v2-lens]').forEach((p) => p.classList.toggle('active', p === pill));
      renderV2Spotlight();
    });
  });

  // V3 Lower Deck Tabs
  document.querySelectorAll('[data-v3-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetKey = tab.dataset.v3Tab;
      document.querySelectorAll('[data-v3-tab]').forEach((t) => t.classList.toggle('active', t === tab));
      document.querySelectorAll('[data-v3-panel]').forEach((panel) => {
        panel.classList.toggle('active', panel.dataset.v3Panel === targetKey);
      });
    });
  });

  // V4 Worship Lens Tabs
  document.querySelectorAll('[data-v4-lens]').forEach((tab) => {
    tab.addEventListener('click', () => {
      v4ActiveLens = tab.dataset.v4Lens;
      document.querySelectorAll('[data-v4-lens]').forEach((t) => t.classList.toggle('active', t === tab));
      renderV4Spotlight();
    });
  });
}

// ==================== Initialize App & Iterations ====================
async function init() {
  bindInteractiveActions();
  setupCompactHadithBars();

  // Load Names, Videos, and Situations in parallel
  const namesList = document.getElementById('namesList');
  await Promise.all([
    dataManager.loadNames(),
    dataManager.loadVideos(),
    situationsView.load(),
  ]);

  const names = dataManager.getAllNames();
  if (namesList) {
    uiRenderer.renderNamesList(names, namesList);
  }

  // Wire standard Browse search input
  const searchInput = document.getElementById('searchInput');
  const searchCount = document.getElementById('searchCount');
  if (searchInput && namesList) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = searchInput.value.trim();
        const results = query ? dataManager.searchNames(query) : names;
        uiRenderer.renderNamesList(results, namesList);
        if (query && searchCount) {
          searchCount.textContent = `${results.length} of 99 names`;
          searchCount.classList.remove('hidden');
        } else if (searchCount) {
          searchCount.classList.add('hidden');
        }
      }, 220);
    });
  }

  // Initialize Memorization & Progress controllers
  sessionController = new SessionController(dataManager);
  progressDashboard = new ProgressDashboard(sessionController.progress, dataManager, uiRenderer);

  // Hydrate dynamic homepage widgets
  hydrateLiveStats();
  renderV1Spotlight();
  renderV2Spotlight();
  renderV4Spotlight();
  setupHomepageQuickSearch('v1QuickSearch', 'v1SearchDropdown');

  // Check URL for requested iteration (?iter=v1, v2, v3, v4, baseline)
  const params = new URLSearchParams(window.location.search);
  const initialIter = params.get('iter') || document.body.dataset.defaultIter || 'v1';
  switchIteration(initialIter);
}

init();
