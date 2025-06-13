importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// Version management - will be replaced during build
const CACHE_VERSION = 'v5.3.5-auto-version';
const STATIC_CACHE = `time-tracker-${CACHE_VERSION}`;

// Set up Workbox
workbox.setConfig({
  debug: false
});

// Precaching
workbox.precaching.precacheAndRoute([
  { url: '/', revision: CACHE_VERSION },
  { url: '/index.html', revision: CACHE_VERSION },
  { url: '/manifest.json', revision: CACHE_VERSION }
]);

// Simple runtime caching
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: STATIC_CACHE
  })
);

// Clean up old caches
workbox.precaching.cleanupOutdatedCaches(); 