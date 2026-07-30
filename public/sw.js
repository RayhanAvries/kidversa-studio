const CACHE_NAME = 'kidversa-v2';
const APP_VERSION = '4.3.0';
const STATIC_ASSETS = [
    '/assets/css/main.css',
    '/assets/css/capture.css',
    '/assets/css/view-photo.css',
    '/assets/js/booth.js',
    '/assets/js/modules/BoothUI.js',
    '/assets/js/modules/CameraManager.js',
    '/assets/js/modules/Config.js',
    '/assets/js/modules/FilterEngine.js',
    '/assets/js/modules/FrameManager.js',
    '/assets/js/modules/Lang.js',
    '/assets/js/modules/ModalManager.js',
    '/assets/js/modules/HandDetection.js',
    '/assets/js/modules/HandDetectionUI.js',
    '/assets/js/modules/InitPermissions.js',
    '/assets/js/modules/ChunkUploader.js',
    '/assets/js/modules/OperationQueue.js',
    '/assets/js/modules/RetryManager.js',
    '/assets/js/modules/ClientQR.js',
    '/assets/js/modules/BlobDownloader.js',
    '/assets/js/modules/MirrorToggleUI.js',
    '/assets/js/modules/SharedActions.js',
    '/assets/js/modules/QueuePage.js',
    '/assets/js/modules/ImageComposer.js',
    '/assets/config/filters.json',
    '/assets/img/logo.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();

    // Notify all clients that a new version is available
    event.waitUntil(
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                client.postMessage({ type: 'SW_UPDATED', version: APP_VERSION });
            });
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(
                    JSON.stringify({ success: false, message: 'Network unavailable' }),
                    {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            })
        );
        return;
    }

    // Network-first for JS files to ensure fresh code is served
    if (url.pathname.endsWith('.js')) {
        event.respondWith(
            fetch(event.request).then((networkResponse) => {
                if (networkResponse.ok) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                return caches.match(event.request);
            })
        );
        return;
    }

    // Cache-first for everything else (CSS, images, fonts)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
                if (networkResponse.ok) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                if (event.request.destination === 'image') {
                    return new Response(
                        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#f0f0f0" width="200" height="200"/><text fill="#999" font-size="14" text-anchor="middle" x="100" y="105">Offline</text></svg>',
                        { headers: { 'Content-Type': 'image/svg+xml' } }
                    );
                }
                return new Response('Offline', { status: 503, statusText: 'Offline' });
            });
        })
    );
});
