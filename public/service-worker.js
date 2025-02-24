const CACHE_NAME = 'schedule-app-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/static/js/main.chunk.js',
    '/static/js/0.chunk.js',
    '/static/js/bundle.js',
    '/manifest.json',
    '/logo192.png',
    '/logo512.png',
    '/favicon.ico'
];

// 서비스 워커 설치 및 캐시
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// 캐시된 컨텐츠를 가져오거나 네트워크 요청
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 캐시에서 찾으면 반환
                if (response) {
                    return response;
                }

                // 네트워크 요청
                return fetch(event.request).then(
                    response => {
                        // 유효한 응답이 아니면 그대로 반환
                        if(!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // 응답을 복제하여 캐시에 저장
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});
