// Time Tracker Service Worker - Simplified for reliable updates
// NOTE: This version string is managed during build/deployment
// For development, it's manually synced with version.json
// For production, it's automatically updated by the build process
const CACHE_VERSION = 'v5.3.4-auto-version';
const STATIC_CACHE = `time-tracker-${CACHE_VERSION}`;
const RUNTIME_CACHE = `time-tracker-runtime-${CACHE_VERSION}`;

// Files to cache for offline access (minimal set)
const CORE_FILES = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install event - cache only core files
self.addEventListener('install', event => {
  console.log(`[SW] Installing service worker ${CACHE_VERSION}...`);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching core files');
        return cache.addAll(CORE_FILES);
      })
      .then(() => {
        console.log('[SW] Skip waiting to force update...');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Error during install:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log(`[SW] Activating service worker ${CACHE_VERSION}...`);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== RUNTIME_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - Network First with Cache Fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external requests
  if (!request.url.startsWith(self.location.origin)) return;
  
  // For HTML requests: Always try network first
  if (request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            // Update cache with fresh content
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache only if network fails
          return caches.match(request);
        })
    );
    return;
  }
  
  // For manifest.json: Always fetch fresh
  if (request.url.includes('manifest.json')) {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .catch(() => caches.match(request))
    );
    return;
  }
  
  // For other resources: Try network first, cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE)
            .then(cache => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Simplified message handling
self.addEventListener('message', (event) => {
  const { action, type } = event.data;
  
  if (action === 'skipWaiting' || type === 'SKIP_WAITING') {
    console.log('[SW] Received skip waiting message');
    self.skipWaiting();
    return;
  }
  
  if (action === 'clearCache' || type === 'CLEAR_CACHE') {
    console.log('[SW] Clearing all caches');
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('[SW] Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        console.log('[SW] All caches cleared');
        // Send success message back if ports are available
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      }).catch(error => {
        console.error('[SW] Cache clearing failed:', error);
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: false, error: error.message });
        }
      })
    );
    return;
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('[SW] Service worker error:', event.error);
});

// Unhandled rejection handling
self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
  event.preventDefault();
}); 