// Service Worker для messenger-интерфейса
const CACHE_NAME = 'coop-messenger-v1';
const urlsToCache = [
    '/index-messenger.html',
    '/messenger-styles.css',
    '/messenger-app-v2.js'
];

// Установка Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ Кэш открыт');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('✅ Service Worker установлен');
                return self.skipWaiting();
            })
            .catch(error => {
                console.log('⚠️ Ошибка кэширования (не критично):', error);
            })
    );
});

// Активация Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Удаление старого кэша:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker активирован');
            return self.clients.claim();
        })
    );
});

// Перехват запросов
self.addEventListener('fetch', event => {
    // Игнорируем chrome-extension и другие не-http запросы
    if (!event.request.url.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                
                return fetch(event.request).then(
                    response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    }
                ).catch(() => {
                    console.log('📴 Офлайн режим');
                });
            })
    );
});
