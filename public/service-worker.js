const CACHE_NAME = 'schedule-app-v2'; // 캐시 이름 변경으로 이전 캐시 무효화
const urlsToCache = [
    '/',
    '/index.html',
    '/static/js/main.chunk.js',
    '/static/js/0.chunk.js',
    '/static/js/bundle.js',
    '/manifest.json',
    '/pdgicon.png',    // 새 아이콘 파일 추가
    '/pdg.png',        // 새 아이콘 파일 추가
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
    // 새 서비스 워커가 즉시 활성화되도록 설정
    self.skipWaiting();
});

// 이전 캐시 삭제
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
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
