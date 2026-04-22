// Shopping List PWA Service Worker
const CACHE_NAME = 'shopping-list-v2';
const STATIC_CACHE_URLS = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './i18n.js',
    './manifest.json',
    './manifest-pt.json',
    './locales/en.json',
    './locales/pt.json'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static resources');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                console.log('Service Worker: Installation complete');
                // Take control immediately
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Installation failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activation complete');
                // Take control of all pages immediately
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip chrome-extension requests and other non-http(s) requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    console.log('Service Worker: Serving from cache', event.request.url);
                    return cachedResponse;
                }

                // Otherwise, try to fetch from network
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Don't cache non-successful responses
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        // Clone the response since it can only be consumed once
                        const responseClone = networkResponse.clone();

                        // Cache the fetched resource for future use
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseClone);
                            });

                        return networkResponse;
                    })
                    .catch(() => {
                        // If both cache and network fail, return a fallback
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});

// Background sync for when connectivity is restored
self.addEventListener('sync', (event) => {
    if (event.tag === 'shopping-list-sync') {
        console.log('Service Worker: Background sync triggered');
        // Here you could sync data with a remote server if needed
        // For now, our app is fully offline-first with localStorage
    }
});

// Push notification event (for future enhancements)
self.addEventListener('push', (event) => {
    if (event.data) {
        const options = {
            body: event.data.text(),
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            vibrate: [200, 100, 200],
            tag: 'shopping-list',
            actions: [
                {
                    action: 'open',
                    title: 'Open App',
                    icon: '/icon-192.png'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification('Shopping List', options)
        );
    }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message event - handle messages from the main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled promise rejection:', event.reason);
});