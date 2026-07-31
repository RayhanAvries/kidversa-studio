// sw.js — Service Worker with dynamic versioning
// Version fetched from /version.json at install time
// CSS/JS: network-first (always fresh)
// Images: cache-first (performance)

let APP_VERSION = '4.3.1'; // fallback if version.json fetch fails

// ============================================================
// INSTALL: Fetch version.json, open cache, skip waiting
// ============================================================
self.addEventListener('install', (event) => {
    event.waitUntil(
        fetch('/version.json')
            .then((response) => response.json())
            .then((data) => {
                APP_VERSION = data.version || APP_VERSION;
                console.log('[SW] Version from version.json:', APP_VERSION);
            })
            .catch((err) => {
                console.warn('[SW] Failed to fetch version.json, using fallback:', APP_VERSION, err);
            })
            .then(() => {
                const CACHE_NAME = `kidversa-v${APP_VERSION}`;
                return caches.open(CACHE_NAME).then((cache) => {
                    console.log('[SW] Cache opened:', CACHE_NAME);
                });
            })
    );
    // Activate new SW immediately without waiting for old one to die
    self.skipWaiting();
});

// ============================================================
// ACTIVATE: Delete old caches, claim clients, notify update
// ============================================================
self.addEventListener('activate', (event) => {
    const currentCache = `kidversa-v${APP_VERSION}`;

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== currentCache)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );

    // Take control of all open pages immediately
    self.clients.claim();

    // Notify all clients that a new SW is active
    event.waitUntil(
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                client.postMessage({
                    type: 'SW_UPDATED',
                    version: APP_VERSION
                });
            });
        })
    );
});

// ============================================================
// MESSAGE: Handle SKIP_WAITING from pages
// ============================================================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// ============================================================
// FETCH: Routing strategy per resource type
// ============================================================
self.addEventListener('fetch', (event) => {
    let url;
    try {
        url = new URL(event.request.url);
    } catch (e) {
        return; // Invalid URL, skip interception
    }

    // --- API calls: network only (no cache) ---
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(
                    JSON.stringify({
                        success: false,
                        message: 'Network unavailable'
                    }),
                    {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            })
        );
        return;
    }

    // --- CSS/JS: network-first (always fresh) ---
    if (url.pathname.endsWith('.css') || url.pathname.endsWith('.js')) {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    // Update cache with fresh version
                    if (networkResponse.ok) {
                        const responseClone = networkResponse.clone();
                        caches.open(`kidversa-v${APP_VERSION}`).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Fallback to cache if offline
                    return caches.match(event.request);
                })
        );
        return;
    }

    // --- Everything else (images, fonts, etc.): cache-first ---
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request)
                .then((networkResponse) => {
                    // Cache successful responses
                    if (networkResponse.ok) {
                        const responseClone = networkResponse.clone();
                        caches.open(`kidversa-v${APP_VERSION}`).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Offline fallback for images
                    if (event.request.destination === 'image') {
                        return new Response(
                            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
                            '<rect fill="#f0f0f0" width="200" height="200"/>' +
                            '<text fill="#999" font-size="14" text-anchor="middle" x="100" y="105">Offline</text>' +
                            '</svg>',
                            { headers: { 'Content-Type': 'image/svg+xml' } }
                        );
                    }
                    return new Response('Offline', {
                        status: 503,
                        statusText: 'Offline'
                    });
                });
        })
    );
});
