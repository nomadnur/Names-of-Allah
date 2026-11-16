/**
 * Main Application - Names of Allah PWA
 * Entry point, navigation, PWA features
 */

import { DataManager } from './data.js';
import { UIRenderer, lockBodyScroll, unlockBodyScroll } from './ui.js';
import { SessionController } from './session.js';
import { ProgressDashboard } from './dashboard.js';
import { SituationsView } from './situations.js';
import { VideoGallery } from './gallery.js';
import { QuranGemsView } from './quranGems.js';

// ==================== Theme ====================
function getSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(theme) {
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const moon = btn?.querySelector('.icon-moon');
  const sun = btn?.querySelector('.icon-sun');
  const studioIcon = document.getElementById('studioThemeIcon');
  const studioLabel = document.getElementById('studioThemeLabel');

  let effectiveDark = false;
  if (theme === 'dark') {
    root.setAttribute('data-theme', 'dark');
    effectiveDark = true;
    if (moon) moon.style.display = 'none';
    if (sun) sun.style.display = '';
    if (btn) btn.setAttribute('aria-label', 'Switch to light mode');
  } else if (theme === 'light') {
    root.setAttribute('data-theme', 'light');
    effectiveDark = false;
    if (moon) moon.style.display = '';
    if (sun) sun.style.display = 'none';
    if (btn) btn.setAttribute('aria-label', 'Switch to dark mode');
  } else {
    // auto — remove override, CSS media query takes over
    root.removeAttribute('data-theme');
    effectiveDark = getSystemDark();
    if (moon) moon.style.display = effectiveDark ? 'none' : '';
    if (sun) sun.style.display = effectiveDark ? '' : 'none';
    if (btn) btn.setAttribute('aria-label', effectiveDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  if (studioIcon) studioIcon.textContent = effectiveDark ? '☀️' : '🌙';
  if (studioLabel) studioLabel.textContent = effectiveDark ? 'Light Mode' : 'Dark Mode';
}

function toggleTheme() {
  const current = localStorage.getItem('theme') || 'auto';
  const isDark = current === 'dark' || (current === 'auto' && getSystemDark());
  const next = isDark ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme(next);
}

// Apply saved theme immediately (before render)
applyTheme(localStorage.getItem('theme') || 'auto');

// ==================== State Management ====================
const state = {
  currentView: 'welcome',
  language: localStorage.getItem('language') || 'en',
  theme: localStorage.getItem('theme') || 'auto',
  names: [],
  browseFilter: 'all',
  favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
};

// Initialize managers
const dataManager = new DataManager();
const uiRenderer = new UIRenderer(dataManager);
let sessionController = null; // Initialized after data loads
let progressDashboard = null; // Initialized after data + session controller
const situationsView = new SituationsView(dataManager, uiRenderer, document.getElementById('situationsContent'));
const videoGallery = new VideoGallery(dataManager, uiRenderer, document.getElementById('videosContent'));
const quranGemsView = new QuranGemsView(dataManager, uiRenderer, document.getElementById('quranGemsContent'));

// ==================== DOM Elements ====================
const elements = {
  menuToggle: document.getElementById('menuToggle'),
  navDrawer: document.getElementById('navDrawer'),
  navOverlay: document.getElementById('navOverlay'),
  navClose: document.getElementById('navClose'),
  navLinks: document.querySelectorAll('.nav-link'),
  views: document.querySelectorAll('.view'),
  homeOptions: document.querySelectorAll('.home-option'),
  headerHomeLink: document.getElementById('headerHomeLink'),
  installPrompt: document.getElementById('installPrompt'),
  installBtn: document.getElementById('installBtn'),
  dismissInstallBtn: document.getElementById('dismissInstallBtn'),
  offlineBanner: document.getElementById('offlineBanner'),
};

// ==================== Navigation ====================
function openNav() {
  elements.navDrawer.setAttribute('aria-hidden', 'false');
  elements.menuToggle.setAttribute('aria-expanded', 'true');
  elements.menuToggle.setAttribute('aria-label', 'Close menu');
  lockBodyScroll();
}

function closeNav() {
  elements.navDrawer.setAttribute('aria-hidden', 'true');
  elements.menuToggle.setAttribute('aria-expanded', 'false');
  elements.menuToggle.setAttribute('aria-label', 'Open menu');
  unlockBodyScroll();
}

const VIEW_TITLES = {
  browse: '📖 Browse All 99 Names',
  situations: '🧭 Find Your Situation',
  videos: '🎬 154 Scholar Videos',
  quranGems: "💎 Qur'an Gems (Nazm al-Durar)",
  memorize: '🧠 Memorize Flashcards',
  progress: '📈 My Progress & 99-Dot Grid',
  favorites: '⭐ Saved Favorites',
};

function switchView(viewName, options = {}) {
  // Hide all views
  elements.views.forEach(view => view.classList.add('hidden'));

  // Show target view
  const targetView = document.getElementById(`${viewName}View`);
  if (targetView) {
    targetView.classList.remove('hidden');
    state.currentView = viewName;
  }

  // Toggle persistent Back to Homepage Studio bar on sub-views
  const backBar = document.getElementById('subviewBackBar');
  const backTitle = document.getElementById('subviewBackTitle');
  if (backBar) {
    if (viewName === 'welcome') {
      backBar.classList.add('hidden');
      updateStudioStats();
    } else {
      backBar.classList.remove('hidden');
      if (backTitle) backTitle.textContent = VIEW_TITLES[viewName] || '';
    }
  }

  // Update active nav link
  elements.navLinks.forEach(link => {
    if (link.dataset.view === viewName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Reset browse filter when switching to browse normally (unless skipBrowseReset is passed)
  if (viewName === 'browse' && !options.skipBrowseReset && state.names.length) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    state.browseFilter = 'all';
    renderBrowse();
  }

  // Initialize memorization session if switching to memorize view
  if (viewName === 'memorize' && sessionController) {
    sessionController.init();
  }

  // Render favorites if switching to favorites view
  if (viewName === 'favorites') {
    uiRenderer.renderFavorites();
  }

  // Render situations from the category list on every switch (unless opening a specific situation)
  if (viewName === 'situations' && !options.skipSituationsRender) {
    situationsView.render();
  }

  // Render the video gallery on every switch
  if (viewName === 'videos') {
    videoGallery.render();
  }

  // Render Qur'an Gems on every switch (unless opening a specific Surah/Ayah)
  if (viewName === 'quranGems' && !options.skipGemsRender) {
    quranGemsView.render();
  }

  // Render progress dashboard on every progress view switch
  if (viewName === 'progress' && progressDashboard) {
    progressDashboard.render();
  }

  // Close nav drawer
  closeNav();

  // Scroll to top — instant on touch devices (smooth scroll janks low-end phones)
  window.scrollTo({ top: 0, behavior: window.matchMedia('(pointer: coarse)').matches ? 'auto' : 'smooth' });
}

// ==================== PWA Install ====================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent default install prompt
  e.preventDefault();
  deferredPrompt = e;

  // Show custom install prompt
  const dismissed = localStorage.getItem('installPromptDismissed');
  if (!dismissed) {
    elements.installPrompt.classList.remove('hidden');
  }
});

async function installApp() {
  if (!deferredPrompt) return;

  // Show native install prompt
  deferredPrompt.prompt();

  // Wait for user response
  const { outcome } = await deferredPrompt.userChoice;


  // Clear prompt
  deferredPrompt = null;
  elements.installPrompt.classList.add('hidden');
}

function dismissInstallPrompt() {
  elements.installPrompt.classList.add('hidden');
  localStorage.setItem('installPromptDismissed', 'true');
}

// ==================== Offline Detection ====================
function updateOnlineStatus() {
  if (navigator.onLine) {
    elements.offlineBanner.classList.add('hidden');
  } else {
    elements.offlineBanner.classList.remove('hidden');
  }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ==================== Service Worker Registration ====================
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker registered:', registration.scope);
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  });
}

// ==================== Event Listeners ====================
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('studioThemeBtn')?.addEventListener('click', toggleTheme);

// Keep icon in sync if system preference changes while app is open
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (!localStorage.getItem('theme') || localStorage.getItem('theme') === 'auto') {
    applyTheme('auto');
  }
});

elements.menuToggle.addEventListener('click', openNav);
elements.navOverlay.addEventListener('click', closeNav);
elements.navClose.addEventListener('click', closeNav);

elements.navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const viewName = link.dataset.view;
    switchView(viewName);
  });
});

elements.homeOptions.forEach(option => {
  option.addEventListener('click', (e) => {
    e.preventDefault();
    switchView(option.dataset.view);
  });
});

// Browse from favorites empty state
const browseFromFavoritesBtn = document.getElementById('browseFromFavoritesBtn');
if (browseFromFavoritesBtn) {
  browseFromFavoritesBtn.addEventListener('click', () => {
    switchView('browse');
  });
}

elements.headerHomeLink.addEventListener('click', (e) => {
  e.preventDefault();
  switchView('welcome');
});

elements.installBtn.addEventListener('click', installApp);
elements.dismissInstallBtn.addEventListener('click', dismissInstallPrompt);

// ==================== Browse: source filter + search ====================
const BROWSE_FILTERS = {
  all: () => true,
  quran: n => n.source_type === 'quran',
  sunnah: n => n.source_type === 'sunnah',
  videos: n => dataManager.getVideosForName(n.index).length > 0,
};
const BROWSE_LABELS = {
  all: 'All sources',
  quran: 'In the Quran',
  sunnah: 'In the Sunnah',
  videos: 'With video',
};

// Filter and search narrow the list together
function renderBrowse() {
  const namesList = document.getElementById('namesList');
  const searchInput = document.getElementById('searchInput');
  const searchCount = document.getElementById('searchCount');
  if (!namesList || !state.names.length) return;

  const query = searchInput ? searchInput.value.trim() : '';
  const pool = query ? dataManager.searchNames(query) : state.names;
  const results = pool.filter(BROWSE_FILTERS[state.browseFilter] || BROWSE_FILTERS.all);
  uiRenderer.renderNamesList(results, namesList);

  document.querySelectorAll('[data-browse-filter]').forEach(btn => {
    const isActive = btn.dataset.browseFilter === state.browseFilter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });

  if (searchCount) {
    const label = BROWSE_LABELS[state.browseFilter] || BROWSE_LABELS.all;
    searchCount.textContent = `Showing ${results.length} of 99 Names · ${label}${query ? ` · matching “${query}”` : ''}`;
    searchCount.classList.remove('hidden');
  }
}

function setBrowseFilter(filter) {
  state.browseFilter = BROWSE_FILTERS[filter] ? filter : 'all';
  renderBrowse();
}

// ==================== Load Names ====================
async function loadNamesData() {
  const namesList = document.getElementById('namesList');

  try {
    namesList.innerHTML = '<p class="loading-text">Loading names...</p>';

    await Promise.all([
      dataManager.loadNames(),
      dataManager.loadVideos(),
      situationsView.load().catch(() => {}),
    ]);
    const names = dataManager.getAllNames();
    state.names = names;

    // Fill the filter counts from the data, then render
    document.querySelectorAll('[data-browse-count]').forEach(el => {
      const test = BROWSE_FILTERS[el.dataset.browseCount];
      if (test) el.textContent = String(names.filter(test).length);
    });
    document.querySelectorAll('[data-browse-filter]').forEach(btn => {
      btn.addEventListener('click', () => setBrowseFilter(btn.dataset.browseFilter));
    });
    renderBrowse();

    // Wire search with debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(renderBrowse, 280);
      });
    }

  } catch (error) {
    namesList.innerHTML = `
      <div class="error-state">
        <p class="text-muted">Failed to load names. Please refresh the page.</p>
        <button class="btn btn-primary" onclick="location.reload()">Refresh</button>
      </div>
    `;
  }
}

// ==================== Home Hadith Narrations ====================
// Four narrations of the 99 Names hadith. Each slide keeps one narration's own
// Arabic and its own English together, verbatim from that hadith (fawazahmed0
// hadith-api). Caution: fawazahmed0's numbering matches sunnah.com for Bukhari,
// Tirmidhi and Abu Dawud, but NOT for Muslim — every Muslim URL here was
// live-verified on sunnah.com individually. arWord/enKey are highlighted.
const HADITH_NARRATIONS = [
  {
    "ref": "Sahih al-Bukhari 7392",
    "url": "https://sunnah.com/bukhari:7392",
    "ar": "إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا مِائَةً إِلاَّ وَاحِدًا، مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ",
    "arWord": "أَحْصَاهَا",
    "en": "Allah has ninety-nine Names, one-hundred less one; and he who memorized them all by heart will enter Paradise.",
    "enKey": "memorized them all by heart"
  },
  {
    "ref": "Sahih al-Bukhari 2736",
    "url": "https://sunnah.com/bukhari:2736",
    "ar": "إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمَا مِائَةً إِلاَّ وَاحِدًا مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ",
    "arWord": "أَحْصَاهَا",
    "en": "Allah has ninety-nine names, i.e. one-hundred minus one, and whoever knows them will go to Paradise.",
    "enKey": "knows them"
  },
  {
    "ref": "Sahih Muslim 2677b",
    "url": "https://sunnah.com/muslim:2677b",
    "ar": "إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا مِائَةً إِلاَّ وَاحِدًا مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ",
    "arWord": "أَحْصَاهَا",
    "en": "Verily, there are ninety-nine names for Allah, i. e. hundred excepting one. He who enumerates them would get into Paradise.",
    "enKey": "enumerates them"
  },
  {
    "ref": "Sahih al-Bukhari 6410",
    "url": "https://sunnah.com/bukhari:6410",
    "ar": "لِلَّهِ تِسْعَةٌ وَتِسْعُونَ اسْمًا، مِائَةٌ إِلاَّ وَاحِدًا، لاَ يَحْفَظُهَا أَحَدٌ إِلاَّ دَخَلَ الْجَنَّةَ، وَهْوَ وَتْرٌ يُحِبُّ الْوَتْرَ",
    "arWord": "يَحْفَظُهَا",
    "en": "Allah has ninety-nine Names, i.e., one hundred minus one, and whoever believes in their meanings and acts accordingly, will enter Paradise; and Allah is witr (one) and loves 'the witr' (i.e., odd numbers)",
    "enKey": "believes in their meanings and acts accordingly"
  }
];

function initHadithNarrations() {
  const slide = document.getElementById('hadithSlide');
  const arabic = document.getElementById('hadithArabic');
  const english = document.getElementById('hadithEnglish');
  const ref = document.getElementById('hadithRef');
  const dots = document.querySelectorAll('.hadith-dot');
  if (!slide || !arabic || !english || !ref || !dots.length) return;

  const mark = (text, key) => text.replace(key, `<mark class="hadith-key">${key}</mark>`);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = 0;
  let timer = null;
  let chosen = false;

  const show = (i) => {
    current = i;
    const n = HADITH_NARRATIONS[i];
    slide.classList.add('changing');
    setTimeout(() => {
      arabic.innerHTML = mark(n.ar, n.arWord);
      english.innerHTML = `“${mark(n.en, n.enKey)}”`;
      ref.innerHTML = `Narrated by Abu Huraira · <a href="${n.url}" target="_blank" rel="noopener noreferrer">${n.ref}</a>`;
      slide.classList.remove('changing');
    }, reduceMotion ? 0 : 300);
    dots.forEach((dot, k) => {
      dot.classList.toggle('active', k === i);
      dot.setAttribute('aria-pressed', String(k === i));
    });
  };

  // Reserve the tallest slide's height so the page below does not jump
  const fitHeight = () => {
    if (!slide.offsetWidth) return;
    slide.style.minHeight = '';
    const probe = slide.cloneNode(true);
    probe.removeAttribute('id');
    probe.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    probe.style.cssText = `position:absolute;visibility:hidden;left:0;right:0;width:${slide.offsetWidth}px`;
    slide.parentElement.appendChild(probe);
    let tallest = 0;
    HADITH_NARRATIONS.forEach(n => {
      probe.querySelector('.home-hadith-arabic').innerHTML = mark(n.ar, n.arWord);
      probe.querySelector('.home-hadith-english p').innerHTML = `“${mark(n.en, n.enKey)}”`;
      tallest = Math.max(tallest, probe.offsetHeight);
    });
    probe.remove();
    if (tallest > 0) slide.style.minHeight = `${tallest}px`;
  };
  fitHeight();
  document.fonts?.ready.then(fitHeight);
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(fitHeight, 200); });

  const stop = () => { clearInterval(timer); timer = null; };
  // On touch devices the auto-advance surprises readers mid-ayah; taps
  // advance manually via the dots instead.
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const start = () => {
    if (reduceMotion || coarsePointer || timer || chosen) return;
    timer = setInterval(() => show((current + 1) % HADITH_NARRATIONS.length), 7000);
  };

  // Choosing a narration stops the cycling, so the reader can stay on it
  dots.forEach((dot, k) => dot.addEventListener('click', () => { chosen = true; stop(); show(k); }));
  const figure = slide.closest('.home-hadith');
  figure.addEventListener('mouseenter', stop);
  figure.addEventListener('mouseleave', start);
  figure.addEventListener('focusin', stop);
  figure.addEventListener('pointerdown', stop); // touch press pauses too
  start();
}

// ==================== Homepage Studio (4 Iterations + Baseline) ====================
let studioToastTimer = null;
function showStudioToast(msg) {
  let toast = document.getElementById('iterStudioToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'iterStudioToast';
    toast.className = 'iter-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(studioToastTimer);
  studioToastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function updateStudioStats() {
  // ProgressTracker exposes getStats() with totalMastered/totalLearned keys
  const raw = sessionController?.progress?.getStats?.() || {};
  const stats = {
    mastered: raw.totalMastered ?? 0,
    learning: raw.totalLearned ?? 0,
    currentStreak: raw.currentStreak ?? 0,
  };
  const favCount = JSON.parse(localStorage.getItem('favorites') || '[]').length;

  document.querySelectorAll('[data-stat="mastered-count"]').forEach(el => {
    el.textContent = String(stats.mastered || 0);
  });
  document.querySelectorAll('[data-stat="learning-count"]').forEach(el => {
    el.textContent = String(stats.learning || 0);
  });
  document.querySelectorAll('[data-stat="streak-count"]').forEach(el => {
    el.textContent = String(stats.currentStreak || 0);
  });
  document.querySelectorAll('[data-stat="favorites-count"]').forEach(el => {
    el.textContent = String(favCount || 0);
  });
}

function initHomepageStudio() {
  // 1. Homepage layout menu (v1, v2, v3, v4, baseline) — tucked behind the header button
  const layoutToggle = document.getElementById('layoutToggle');
  const layoutMenu = document.getElementById('layoutMenu');
  const layoutOptions = [...document.querySelectorAll('.layout-option[data-iter]')];

  const setLayoutMenu = (open) => {
    if (!layoutMenu || !layoutToggle) return;
    layoutMenu.hidden = !open;
    layoutToggle.setAttribute('aria-expanded', String(open));
    if (open) {
      (layoutOptions.find(o => o.getAttribute('aria-checked') === 'true') || layoutOptions[0])?.focus();
    }
  };

  const applyLayout = (key) => {
    const panes = document.querySelectorAll('.iter-pane[data-iter-pane]');
    if (![...panes].some(p => p.getAttribute('data-iter-pane') === key)) return false;
    panes.forEach(pane => {
      pane.classList.toggle('active', pane.getAttribute('data-iter-pane') === key);
    });
    layoutOptions.forEach(o => {
      o.setAttribute('aria-checked', String(o.getAttribute('data-iter') === key));
    });
    return true;
  };

  try {
    const saved = localStorage.getItem('homeLayout');
    if (saved) applyLayout(saved);
  } catch (_) { /* storage blocked: keep the default layout */ }

  layoutToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    setLayoutMenu(layoutMenu.hidden);
  });

  layoutOptions.forEach(option => {
    option.addEventListener('click', () => {
      const key = option.getAttribute('data-iter');
      if (state.currentView !== 'welcome') {
        switchView('welcome');
      }
      applyLayout(key);
      try { localStorage.setItem('homeLayout', key); } catch (_) { /* not critical */ }
      setLayoutMenu(false);
      layoutToggle?.focus();
      showStudioToast('Layout: ' + option.querySelector('.layout-option-name').textContent.trim());
    });
  });

  layoutMenu?.addEventListener('keydown', (e) => {
    const i = layoutOptions.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); layoutOptions[(i + 1) % layoutOptions.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); layoutOptions[(i - 1 + layoutOptions.length) % layoutOptions.length].focus(); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && layoutMenu && !layoutMenu.hidden) {
      setLayoutMenu(false);
      layoutToggle?.focus();
    }
  });

  document.addEventListener('click', (e) => {
    if (layoutMenu && !layoutMenu.hidden && !e.target.closest('.layout-switch')) {
      setLayoutMenu(false);
    }
  });

  // 2. Spotlights & Worship Lenses (V1, V2, V4) backed by full 99 Names dataset
  const SPOTLIGHT_POOL = [54, 90, 32, 79, 24, 43, 30, 1, 14, 59, 47, 85, 25, 48, 97, 10];
  let v1SpotIdx = 54;
  let v2SpotIdx = 90;
  let v4SpotIdx = 54;
  let v2ActiveLens = 'when_to_invoke';
  let v4ActiveLens = 'meaning';

  const getLensText = (nameObj, lens) => {
    if (!nameObj) return '';
    if (lens === 'meaning' || lens === 'aqeedah') return nameObj.aqeedah_belief || nameObj.description_en || nameObj.english_meaning;
    if (lens === 'when_to_invoke' || lens === 'invoke') return nameObj.when_to_invoke || nameObj.description_en;
    if (lens === 'in_salah' || lens === 'salah') return nameObj.salah_usage || nameObj.when_to_invoke;
    if (lens === 'in_dua' || lens === 'dua') return nameObj.dua_usage || nameObj.when_to_invoke;
    if (lens === 'al_ghazali' || lens === 'ghazali') return nameObj.ghazali_insight || nameObj.al_jalil_commentary || nameObj.aqeedah_belief;
    return nameObj.when_to_invoke || nameObj.english_meaning;
  };

  const renderV1Spotlight = (idx) => {
    const n = dataManager.getNameByIndex(idx);
    if (!n) return;
    v1SpotIdx = n.index;
    const vids = dataManager.getVideosForName(n.index);
    const proof = n.proof_quran || n.proof_hadith || 'Sunnah';
    const tr = document.getElementById('v1SpotTranslit');
    const mn = document.getElementById('v1SpotMeaning');
    const iv = document.getElementById('v1SpotInvoke');
    const ar = document.getElementById('v1SpotArabic');
    const rf = document.getElementById('v1SpotRef');
    const bt = document.getElementById('v1SpotExplore');
    if (tr) tr.textContent = `#${n.index} ${n.transliteration}`;
    if (mn) mn.textContent = n.english_meaning;
    if (iv) iv.textContent = n.when_to_invoke || n.aqeedah_belief || '';
    if (ar) ar.textContent = n.arabic;
    if (rf) rf.textContent = `${proof} · ${vids.length} video${vids.length === 1 ? '' : 's'}`;
    if (bt) bt.setAttribute('data-open-name', String(n.index));
  };

  const renderV2Spotlight = (idx) => {
    const n = dataManager.getNameByIndex(idx);
    if (!n) return;
    v2SpotIdx = n.index;
    const tr = document.getElementById('v2SpotTranslit');
    const mn = document.getElementById('v2SpotMeaning');
    const ar = document.getElementById('v2SpotArabic');
    const bx = document.getElementById('v2SpotLensBox');
    const bt = document.getElementById('v2SpotExplore');
    if (tr) tr.textContent = `#${n.index} ${n.transliteration}`;
    if (mn) mn.textContent = n.english_meaning;
    if (ar) ar.textContent = n.arabic;
    if (bx) bx.textContent = getLensText(n, v2ActiveLens);
    if (bt) bt.setAttribute('data-open-name', String(n.index));
  };

  const renderV4Spotlight = (idx) => {
    const n = dataManager.getNameByIndex(idx);
    if (!n) return;
    v4SpotIdx = n.index;
    const tr = document.getElementById('v4SpotTranslit');
    const mn = document.getElementById('v4SpotMeaning');
    const ar = document.getElementById('v4SpotArabic');
    const bd = document.getElementById('v4SpotLensBody');
    const rf = document.getElementById('v4SpotRef');
    const bt = document.getElementById('v4SpotExplore');
    if (tr) tr.textContent = `#${n.index} ${n.transliteration}`;
    if (mn) mn.textContent = n.english_meaning;
    if (ar) ar.textContent = n.arabic;
    if (bd) bd.textContent = getLensText(n, v4ActiveLens);
    if (rf) rf.textContent = n.proof_quran || n.proof_hadith || 'Authenticated Sunnah';
    if (bt) bt.setAttribute('data-open-name', String(n.index));
  };

  const nextSpotlightFromPool = (current) => {
    const pos = SPOTLIGHT_POOL.indexOf(current);
    return SPOTLIGHT_POOL[(pos + 1) % SPOTLIGHT_POOL.length];
  };

  renderV1Spotlight(54);
  renderV2Spotlight(90);
  renderV4Spotlight(54);

  document.getElementById('v1ShuffleBtn')?.addEventListener('click', () => {
    renderV1Spotlight(nextSpotlightFromPool(v1SpotIdx));
    const n = dataManager.getNameByIndex(v1SpotIdx);
    if (n) showStudioToast(`✨ Spotlight: #${n.index} ${n.transliteration}`);
  });

  document.getElementById('v2ShuffleBtn')?.addEventListener('click', () => {
    renderV2Spotlight(nextSpotlightFromPool(v2SpotIdx));
    const n = dataManager.getNameByIndex(v2SpotIdx);
    if (n) showStudioToast(`✨ Spotlight: #${n.index} ${n.transliteration}`);
  });

  document.getElementById('v4ShuffleBtn')?.addEventListener('click', () => {
    renderV4Spotlight(nextSpotlightFromPool(v4SpotIdx));
    const n = dataManager.getNameByIndex(v4SpotIdx);
    if (n) showStudioToast(`✨ Companion: #${n.index} ${n.transliteration}`);
  });

  // V2 Worship Lens pills
  document.querySelectorAll('[data-v2-lens]').forEach(pill => {
    pill.addEventListener('click', () => {
      v2ActiveLens = pill.getAttribute('data-v2-lens');
      document.querySelectorAll('[data-v2-lens]').forEach(p => p.classList.toggle('active', p === pill));
      const bx = document.getElementById('v2SpotLensBox');
      if (bx) bx.textContent = getLensText(dataManager.getNameByIndex(v2SpotIdx), v2ActiveLens);
    });
  });

  // V4 Worship Lens tabs
  document.querySelectorAll('[data-v4-lens]').forEach(tab => {
    tab.addEventListener('click', () => {
      v4ActiveLens = tab.getAttribute('data-v4-lens');
      document.querySelectorAll('[data-v4-lens]').forEach(t => t.classList.toggle('active', t === tab));
      const bd = document.getElementById('v4SpotLensBody');
      if (bd) bd.textContent = getLensText(dataManager.getNameByIndex(v4SpotIdx), v4ActiveLens);
    });
  });

  // 3. V3 Tabbed Lower Deck (Names / Videos / Practice)
  document.querySelectorAll('[data-v3-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      const key = tab.getAttribute('data-v3-tab');
      document.querySelectorAll('[data-v3-tab]').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('[data-v3-panel]').forEach(p => {
        p.classList.toggle('active', p.getAttribute('data-v3-panel') === key);
      });
    });
  });

  // 4. Compact Hadith Ribbon Narration Pills (V1)
  document.querySelectorAll('[data-narration-idx]').forEach(pill => {
    pill.addEventListener('click', () => {
      const idx = parseInt(pill.getAttribute('data-narration-idx'), 10) || 0;
      const n = HADITH_NARRATIONS[idx] || HADITH_NARRATIONS[0];
      const mark = (text, key) => text.replace(key, `<mark class="hadith-key">${key}</mark>`);
      const widget = pill.closest('[data-hadith-widget]') || document;
      widget.querySelectorAll('[data-narration-idx]').forEach(p => p.classList.toggle('active', p === pill));
      const enEl = widget.querySelector('[data-hadith-en]');
      const arEl = widget.querySelector('[data-hadith-ar]');
      const rfEl = widget.querySelector('[data-hadith-ref]');
      if (enEl) enEl.innerHTML = `“${mark(n.en, n.enKey)}”`;
      if (arEl) arEl.innerHTML = mark(n.ar, n.arWord);
      if (rfEl) rfEl.innerHTML = `<a href="${n.url}" target="_blank" rel="noopener noreferrer">${n.ref} ↗</a>`;
    });
  });

  // 5. V1 Instant Hero Search (Searches 99 Names + 27 Situations live)
  const v1Input = document.getElementById('v1QuickSearch');
  const v1Drop = document.getElementById('v1SearchDropdown');
  if (v1Input && v1Drop) {
    v1Input.addEventListener('input', () => {
      const q = v1Input.value.trim();
      if (!q) {
        v1Drop.classList.add('hidden');
        v1Drop.innerHTML = '';
        return;
      }
      const lower = q.toLowerCase();
      const matchedNames = dataManager.searchNames(q).slice(0, 5);
      const matchedSits = (situationsView.situations || []).filter(s =>
        s.title.toLowerCase().includes(lower) ||
        s.category.toLowerCase().includes(lower) ||
        (s.point && s.point.toLowerCase().includes(lower))
      ).slice(0, 3);

      let html = '';
      if (matchedNames.length) {
        html += '<div class="v1-drop-label">Names of Allah</div>';
        matchedNames.forEach(n => {
          html += `<button type="button" class="v1-drop-item" data-open-name="${n.index}">` +
            `<span><strong>#${n.index} ${n.transliteration}</strong> — <span class="v1-drop-meaning">${n.english_meaning}</span></span>` +
            `<span lang="ar" dir="rtl" class="v1-drop-arabic">${n.arabic}</span>` +
          `</button>`;
        });
      }
      if (matchedSits.length) {
        html += '<div class="v1-drop-label v1-drop-label-sits">Life Situations</div>';
        matchedSits.forEach(s => {
          html += `<button type="button" class="v1-drop-item" data-open-situation="${s.id}">` +
            `<span>🧭 <strong>${s.title}</strong> <span class="v1-drop-cat">(${s.category})</span></span>` +
            `<span class="v1-drop-open">Open →</span>` +
          `</button>`;
        });
      }
      if (!html) {
        html = `<div class="v1-drop-empty">No direct matches for "${q}". Try "mercy", "anxious", "Razzaq", or "Shaafee".</div>`;
      }
      v1Drop.innerHTML = html;
      v1Drop.classList.remove('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!v1Drop.contains(e.target) && e.target !== v1Input) {
        v1Drop.classList.add('hidden');
      }
    });
  }

  // 6. Global Delegated Click Handler for Homepage Studio Cards, Chips, Videos, Situations & Filters
  document.addEventListener('click', async (e) => {
    // 6A. Open Name Detail Modal: [data-open-name]
    const nameTrigger = e.target.closest('[data-open-name]');
    if (nameTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const idx = parseInt(nameTrigger.getAttribute('data-open-name'), 10);
      if (v1Drop) v1Drop.classList.add('hidden');
      uiRenderer.showNameDetail(idx);
      return;
    }

    // 6B. Open Video Player Modal: [data-open-video]
    const videoTrigger = e.target.closest('[data-open-video]');
    if (videoTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const videoId = videoTrigger.getAttribute('data-open-video');
      const videoTitle = videoTrigger.getAttribute('data-video-title') || 'Video Lesson';
      uiRenderer.openVideoPlayer(videoId, videoTitle, videoTrigger);
      return;
    }

    // 6C. Open Specific Situation: [data-open-situation]
    const sitTrigger = e.target.closest('[data-open-situation]');
    if (sitTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const sitId = sitTrigger.getAttribute('data-open-situation');
      if (v1Drop) v1Drop.classList.add('hidden');
      switchView('situations', { skipSituationsRender: true });
      await situationsView.load();
      situationsView.renderSituation(sitId);
      return;
    }

    // 6C-2. Open Specific Qur'an Gem: [data-open-gem-surah]
    const gemTrigger = e.target.closest('[data-open-gem-surah]');
    if (gemTrigger) {
      e.preventDefault();
      e.stopPropagation();
      const surahNum = Number(gemTrigger.getAttribute('data-open-gem-surah'));
      const ayahKey = gemTrigger.getAttribute('data-open-gem-ayah') || '';
      if (v1Drop) v1Drop.classList.add('hidden');
      switchView('quranGems', { skipGemsRender: true });
      quranGemsView.buildGroups();
      quranGemsView.renderSurahDetail(surahNum, ayahKey);
      return;
    }

    // 6D. Browse with Filter Pill: [data-filter-type]
    const filterTrigger = e.target.closest('[data-filter-type]');
    if (filterTrigger) {
      e.preventDefault();
      const fType = filterTrigger.getAttribute('data-filter-type');
      switchView('browse', { skipBrowseReset: true });
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = '';
      setBrowseFilter(fType);
      return;
    }

    // 6E. Switch View Button: [data-switch-view]
    const viewTrigger = e.target.closest('[data-switch-view]');
    if (viewTrigger) {
      e.preventDefault();
      const targetView = viewTrigger.getAttribute('data-switch-view');
      switchView(targetView);
    }
  });

  // Refresh stats when modal closes (e.g., after starring a Favorite)
  document.getElementById('modalClose')?.addEventListener('click', () => setTimeout(updateStudioStats, 50));
  document.getElementById('modalOverlay')?.addEventListener('click', () => setTimeout(updateStudioStats, 50));
}

function renderHomepageGemsShelf() {
  const scroller = document.getElementById('v1GemsScroller');
  if (!scroller) return;
  const pool = state.names.filter(n => n.nazm_al_durar_insight?.note);
  if (!pool.length) return;

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const picks = shuffled.slice(0, 5);

  const escape = (s) => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  scroller.innerHTML = picks.map(n => {
    const nd = n.nazm_al_durar_insight;
    const surahNum = String(nd.ayah || '').split(':')[0];
    return `
      <article class="v1-sit-card" data-open-gem-surah="${escape(surahNum)}" data-open-gem-ayah="${escape(nd.ayah)}" tabindex="0" role="button" aria-label="Open Qur'an Gem for ${escape(n.transliteration)} (${escape(nd.ayah_ref || nd.ayah)})">
        <div>
          <span class="v1-sit-cat">${escape(nd.ayah_ref || `Ayah ${nd.ayah}`)}</span>
          <h4 class="v1-sit-title v1-gem-note">${escape(nd.note)}</h4>
        </div>
        <div class="v1-sit-names-preview">
          <div class="v1-sit-ar-chips">
            <span class="v1-sit-ar-chip" lang="ar" dir="rtl">${escape(n.arabic)}</span>
            <span class="v1-gem-translit">${escape(n.transliteration)}</span>
          </div>
          <span class="v1-sit-count">Read gem →</span>
        </div>
      </article>
    `;
  }).join('');
}

// ==================== Initialize App ====================
async function init() {

  // Check online status
  updateOnlineStatus();

  // Load names data
  await loadNamesData();

  // Initialize session controller (after data is loaded)
  sessionController = new SessionController(dataManager);
  progressDashboard = new ProgressDashboard(sessionController.progress, dataManager, uiRenderer);

  initHadithNarrations();
  initHomepageStudio();
  renderHomepageGemsShelf();
  updateStudioStats();

  // Home screen is the main menu, so every visit starts there
  switchView('welcome');
}

// Start app
init();
