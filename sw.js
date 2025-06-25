importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// Version management - will be replaced during build
const CACHE_VERSION = 'v5.3.8-sw-fix';
const STATIC_CACHE = `time-tracker-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `time-tracker-dynamic-${CACHE_VERSION}`;

// Set up Workbox
if (workbox) {
  workbox.setConfig({
    debug: false
  });

  // Precaching
  workbox.precaching.precacheAndRoute([
    { url: '/index.html', revision: CACHE_VERSION },
    { url: '/manifest.json', revision: CACHE_VERSION },
    { url: '/css/main.css', revision: CACHE_VERSION },
    { url: '/css/components.css', revision: CACHE_VERSION },
    { url: '/js/app.js', revision: CACHE_VERSION }
  ]);

  // Caching strategy for scripts and styles
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'script' || request.destination === 'style',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: STATIC_CACHE
    })
  );

  // Caching strategy for images
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: DYNAMIC_CACHE
    })
  );

  // Clean up old caches
  workbox.precaching.cleanupOutdatedCaches();
} else {
  console.error("Workbox couldn't be loaded. Offline caching will not work.");
}

// Activate new service worker as soon as it's installed
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
}); 