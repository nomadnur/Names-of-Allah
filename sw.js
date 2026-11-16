/**
 * Service Worker - Names of Allah PWA
 * Offline-first caching strategy
 */

const CACHE_VERSION = 'v1.28.0';
const CACHE_NAME = `names-of-allah-${CACHE_VERSION}`;

// Files to cache on install
const STATIC_ASSETS = [
  './index.html',
  './manifest.json',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/names.css',
  './css/memorization.css',
  './css/progress.css',
  './css/situations.css',
  './iterations/iterations.css',
  './css/refine.css',
  './iterations/palette.css',
  './iterations/scheme.js',
  './js/app.js',
  './js/data.js',
  './js/ui.js',
  './js/memorization.js',
  './js/progress.js',
  './js/session.js',
  './js/dashboard.js',
  './js/situations.js',
  './js/gallery.js',
  './data/names.json',
  './data/situations.json',
  './data/videos.json',
  './assets/icons/icon-192.png?v=17',
  './assets/icons/icon-512.png?v=17',
  './assets/icons/icon-512-maskable.png?v=17',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      // cache: 'reload' skips the browser's HTTP cache, so a new version
      // never stores a stale copy of a file next to fresh ones
      const requests = STATIC_ASSETS.map((url) => new Request(url, { cache: 'reload' }));
      return cache.addAll(requests).catch((error) => {
        console.error('[Service Worker] Failed to cache:', error);
        // Continue even if some files fail
        return Promise.resolve();
      });
    })
  );

  // Force immediate activation
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control of all clients immediately
  return self.clients.claim();
});

// Fetch event - cache-first strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except fonts)
  const url = new URL(request.url);
  if (
    url.origin !== location.origin &&
    !url.origin.includes('fonts.googleapis.com') &&
    !url.origin.includes('fonts.gstatic.com')
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response immediately
        return cachedResponse;
      }

      // Not in cache - fetch from network
      return fetch(request)
        .then((networkResponse) => {
          // Don't cache non-200 responses
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Clone response (can only be consumed once)
          const responseToCache = networkResponse.clone();

          // Cache for next time
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch((error) => {
          console.error('[Service Worker] Fetch failed:', error);

          // Return offline fallback if available
          return caches.match('./index.html');
        });
    })
  );
});

// Message event - handle commands from app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
