/**
 * Main Application - Names of Allah PWA
 * Entry point, navigation, PWA features
 */

import { DataManager } from './data.js';
import { UIRenderer } from './ui.js';
import { SessionController } from './session.js';
import { ProgressDashboard } from './dashboard.js';
import { SituationsView } from './situations.js';
import { VideoGallery } from './gallery.js';

// ==================== Theme ====================
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
    // auto — remove override, CSS media query takes over
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

// Apply saved theme immediately (before render)
applyTheme(localStorage.getItem('theme') || 'auto');

// ==================== State Management ====================
const state = {
  currentView: 'welcome',
  language: localStorage.getItem('language') || 'en',
  theme: localStorage.getItem('theme') || 'auto',
  names: [],
  favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
};

// Initialize managers
const dataManager = new DataManager();
const uiRenderer = new UIRenderer(dataManager);
let sessionController = null; // Initialized after data loads
let progressDashboard = null; // Initialized after data + session controller
const situationsView = new SituationsView(dataManager, uiRenderer, document.getElementById('situationsContent'));
const videoGallery = new VideoGallery(dataManager, uiRenderer, document.getElementById('videosContent'));

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
  document.body.style.overflow = 'hidden';
}

function closeNav() {
  elements.navDrawer.setAttribute('aria-hidden', 'true');
  elements.menuToggle.setAttribute('aria-expanded', 'false');
  elements.menuToggle.setAttribute('aria-label', 'Open menu');
  document.body.style.overflow = '';
}

function switchView(viewName) {
  // Hide all views
  elements.views.forEach(view => view.classList.add('hidden'));

  // Show target view
  const targetView = document.getElementById(`${viewName}View`);
  if (targetView) {
    targetView.classList.remove('hidden');
    state.currentView = viewName;
  }

  // Update active nav link
  elements.navLinks.forEach(link => {
    if (link.dataset.view === viewName) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Initialize memorization session if switching to memorize view
  if (viewName === 'memorize' && sessionController) {
    sessionController.init();
  }

  // Render favorites if switching to favorites view
  if (viewName === 'favorites') {
    uiRenderer.renderFavorites();
  }

  // Render situations from the category list on every switch
  if (viewName === 'situations') {
    situationsView.render();
  }

  // Render the video gallery on every switch
  if (viewName === 'videos') {
    videoGallery.render();
  }

  // Render progress dashboard on every progress view switch
  if (viewName === 'progress' && progressDashboard) {
    progressDashboard.render();
  }

  // Close nav drawer
  closeNav();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

// ==================== Load Names ====================
async function loadNamesData() {
  const namesList = document.getElementById('namesList');

  try {
    namesList.innerHTML = '<p class="loading-text">Loading names...</p>';

    await Promise.all([dataManager.loadNames(), dataManager.loadVideos()]);
    const names = dataManager.getAllNames();
    state.names = names;

    // Render names list
    uiRenderer.renderNamesList(names, namesList);

    // Wire search with debounce
    const searchInput = document.getElementById('searchInput');
    const searchCount = document.getElementById('searchCount');
    if (searchInput) {
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
        }, 280);
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
// hadith-api, which follows sunnah.com numbering). arWord/enKey are highlighted.
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
    slide.style.minHeight = `${tallest}px`;
  };
  fitHeight();
  document.fonts?.ready.then(fitHeight);
  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(fitHeight, 200); });

  const stop = () => { clearInterval(timer); timer = null; };
  const start = () => {
    if (reduceMotion || timer || chosen) return;
    timer = setInterval(() => show((current + 1) % HADITH_NARRATIONS.length), 7000);
  };

  // Choosing a narration stops the cycling, so the reader can stay on it
  dots.forEach((dot, k) => dot.addEventListener('click', () => { chosen = true; stop(); show(k); }));
  const figure = slide.closest('.home-hadith');
  figure.addEventListener('mouseenter', stop);
  figure.addEventListener('mouseleave', start);
  figure.addEventListener('focusin', stop);
  start();
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

  // Home screen is the main menu, so every visit starts there
  switchView('welcome');
}

// Start app
init();
