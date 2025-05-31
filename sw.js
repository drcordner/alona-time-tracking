// Time Tracker Service Worker
const CACHE_VERSION = 'v5.1.3';
const STATIC_CACHE = `time-tracker-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `time-tracker-dynamic-${CACHE_VERSION}`;

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/components.css', 
  '/css/timer.css',
  '/css/management.css',
  '/css/goals.css',
  '/js/app.js',
  '/js/data.js',
  '/js/storage.js',
  '/js/timer.js',
  '/js/quickstart.js',
  '/js/reports.js',
  '/js/management.js',
  '/js/goals.js',
  '/js/utils.js',
  '/js/ux-enhancements.js',
  // Add any icons when available
  '/images/icon-192x192.png',
  '/images/icon-512x512.png'
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker v5.1.2...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
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

// Activate event - clean up old caches and handle manifest updates
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker v5.1.2...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Force refresh of manifest and critical files
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Force refreshing manifest.json...');
        return fetch('/manifest.json', { cache: 'no-cache' })
          .then(response => {
            if (response.ok) {
              return cache.put('/manifest.json', response);
            }
          })
          .catch(error => {
            console.warn('[SW] Could not refresh manifest:', error);
          });
      }),
      // Claim clients to immediately take control
      self.clients.claim()
    ])
  );
});

// Fetch event - serve from cache when offline, with manifest handling
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip external requests
  if (!request.url.startsWith(self.location.origin)) return;
  
  // Special handling for manifest.json to ensure fresh copy
  if (request.url.includes('manifest.json')) {
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE)
              .then(cache => cache.put(request, responseClone));
            return response;
          }
          return caches.match(request);
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', request.url);
          return cachedResponse;
        }
        
        // Fetch from network and cache dynamic content
        return fetch(request)
          .then(response => {
            // Only cache successful responses
            if (response.status === 200) {
              const responseClone = response.clone();
              
              caches.open(DYNAMIC_CACHE)
                .then(cache => {
                  cache.put(request, responseClone);
                });
            }
            
            return response;
          })
          .catch(() => {
            // Return offline page for HTML requests
            if (request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Handle messages from the application
self.addEventListener('message', (event) => {
    const { action } = event.data;
    
    if (action === 'skipWaiting') {
        console.log('[SW] Received skip waiting message');
        return self.skipWaiting();
    }
    
    if (action === 'forceUpdate') {
        console.log('[SW] Received force update message');
        // Force a cache refresh
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName.startsWith('time-tracker-v')) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.skipWaiting();
        });
    }
});

// Background sync for data persistence
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync-data') {
    event.waitUntil(syncData());
  }
});

// Sync data function
async function syncData() {
  try {
    console.log('[SW] Syncing data...');
    // Here you could sync data with a backend if needed
    // For now, we just log the sync attempt
    return Promise.resolve();
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error;
  }
}

// Handle push notifications (for future use)
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Time tracking update',
      icon: '/images/icon-192x192.png',
      badge: '/images/icon-72x72.png',
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: 'View App'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Time Tracker', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
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