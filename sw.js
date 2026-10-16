/**
 * Service Worker - AI स्पर्धा परीक्षा स्टुडिओ
 * सर्व डिव्हाईसवर (मोबाईल, टॅबलेट, लॅपटॉप) विना-इंटरनेट चालवण्यासाठी संपूर्ण ऑफलाइन कॅशिंग
 */

const CACHE_NAME = 'ai-exam-studio-v2';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/data/questionBank.js',
    './js/ai-engine.js',
    './js/exam.js',
    './js/app.js'
];

// Install event: Pre-cache core files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event: Clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event: Cache-first fallback strategy
self.addEventListener('fetch', (event) => {
    // Skip external API requests like Gemini API
    if (event.request.url.includes('generativelanguage.googleapis.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
                    const clonedResponse = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clonedResponse);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Offline fallback
                if (event.request.headers.get('accept')?.includes('text/html')) {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
