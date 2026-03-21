/**
 * Main Application - Names of Allah PWA
 * Entry point, navigation, PWA features
 */

import { DataManager } from './data.js';
import { UIRenderer } from './ui.js';
import { SessionController } from './session.js';
import { ProgressDashboard } from './dashboard.js';

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

// ==================== DOM Elements ====================
const elements = {
  menuToggle: document.getElementById('menuToggle'),
  navDrawer: document.getElementById('navDrawer'),
  navOverlay: document.getElementById('navOverlay'),
  navClose: document.getElementById('navClose'),
  navLinks: document.querySelectorAll('.nav-link'),
  views: document.querySelectorAll('.view'),
  getStartedBtn: document.getElementById('getStartedBtn'),
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

  console.log(`User response to install prompt: ${outcome}`);

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

elements.getStartedBtn.addEventListener('click', () => {
  switchView('browse');
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

    await dataManager.loadNames();
    const names = dataManager.getAllNames();
    state.names = names;

    // Render names list
    uiRenderer.renderNamesList(names, namesList);

    // Show stats
    const stats = dataManager.getStats();
    console.log('📊 Stats:', stats);

  } catch (error) {
    namesList.innerHTML = `
      <div class="error-state">
        <p class="text-muted">Failed to load names. Please refresh the page.</p>
        <button class="btn btn-primary" onclick="location.reload()">Refresh</button>
      </div>
    `;
  }
}

// ==================== Initialize App ====================
async function init() {
  console.log('Names of Allah PWA initialized');

  // Check online status
  updateOnlineStatus();

  // Load names data
  await loadNamesData();

  // Initialize session controller (after data is loaded)
  sessionController = new SessionController(dataManager);
  progressDashboard = new ProgressDashboard(sessionController.progress, dataManager, uiRenderer);

  // Check if first visit
  const hasVisited = localStorage.getItem('hasVisited');
  if (hasVisited) {
    // Returning user - show browse view
    switchView('browse');
  } else {
    // First visit - show welcome
    localStorage.setItem('hasVisited', 'true');
    switchView('welcome');
  }
}

// Start app
init();
