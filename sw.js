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

// Critical resources - use NetworkFirst strategy
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'script',
  new workbox.strategies.NetworkFirst({
    cacheName: STATIC_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

// Styles and other static assets - use StaleWhileRevalidate
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'style' || request.destination === 'image',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: STATIC_CACHE,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);

// Clean up old caches
workbox.precaching.cleanupOutdatedCaches(); 