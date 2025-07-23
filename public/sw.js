// sw.js - Service Worker for PWA functionality
const CACHE_NAME = 'vacation-management-v1.0.0';
const STATIC_CACHE_NAME = 'vacation-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'vacation-dynamic-v1.0.0';

// 캐시할 정적 자원들
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico'
];

// 동적 캐시할 API 엔드포인트들
const DYNAMIC_CACHE_URLS = [
  '/api/holidays',
  '/api/departments'
];

// Service Worker 설치
self.addEventListener('install', event => {
  console.log('🔧 Service Worker 설치 중...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('📦 정적 자원 캐시 중...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker 설치 완료');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Service Worker 설치 실패:', error);
      })
  );
});

// Service Worker 활성화
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker 활성화 중...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        // 오래된 캐시 삭제
        const deletePromises = cacheNames
          .filter(cacheName => {
            return cacheName !== STATIC_CACHE_NAME && 
                   cacheName !== DYNAMIC_CACHE_NAME &&
                   cacheName.startsWith('vacation-');
          })
          .map(cacheName => {
            console.log('🗑️ 오래된 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          });
        
        return Promise.all(deletePromises);
      })
      .then(() => {
        console.log('✅ Service Worker 활성화 완료');
        return self.clients.claim();
      })
  );
});

// 네트워크 요청 가로채기
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // GET 요청만 캐시 처리
  if (request.method !== 'GET') {
    return;
  }
  
  // 정적 자원 처리 (Cache First)
  if (STATIC_ASSETS.some(asset => url.pathname.endsWith(asset))) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => {
          if (cachedResponse) {
            console.log('📦 캐시에서 제공:', url.pathname);
            return cachedResponse;
          }
          
          return fetch(request)
            .then(response => {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE_NAME)
                .then(cache => cache.put(request, responseClone));
              return response;
            });
        })
    );
    return;
  }
  
  // API 요청 처리 (Network First with Cache Fallback)
  if (url.pathname.startsWith('/api/') || DYNAMIC_CACHE_URLS.some(apiUrl => url.pathname.includes(apiUrl))) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 성공적인 응답이면 캐시에 저장
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // 네트워크 실패 시 캐시에서 찾기
          console.log('🌐 네트워크 실패, 캐시에서 찾는 중:', url.pathname);
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                console.log('📦 캐시에서 제공 (오프라인):', url.pathname);
                return cachedResponse;
              }
              
              // 캐시에도 없으면 오프라인 페이지 또는 기본 응답
              return new Response(
                JSON.stringify({ 
                  error: 'offline', 
                  message: '오프라인 상태입니다. 인터넷 연결을 확인해주세요.' 
                }),
                {
                  headers: { 'Content-Type': 'application/json' },
                  status: 503
                }
              );
            });
        })
    );
    return;
  }
  
  // 기타 요청 처리 (Stale While Revalidate)
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        const fetchPromise = fetch(request)
          .then(response => {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME)
              .then(cache => cache.put(request, responseClone));
            return response;
          })
          .catch(() => {
            // 네트워크 실패 시 오프라인 페이지
            if (request.destination === 'document') {
              return caches.match('/');
            }
            return new Response('오프라인 상태입니다.', { status: 503 });
          });
        
        // 캐시가 있으면 즉시 반환하고 백그라운드에서 업데이트
        return cachedResponse || fetchPromise;
      })
  );
});

// 백그라운드 동기화 (미래 기능)
self.addEventListener('sync', event => {
  console.log('🔄 백그라운드 동기화:', event.tag);
  
  if (event.tag === 'vacation-data-sync') {
    event.waitUntil(
      // 오프라인 중에 저장된 데이터를 서버와 동기화
      syncVacationData()
    );
  }
});

// 푸시 알림 처리 (미래 기능)
self.addEventListener('push', event => {
  console.log('📱 푸시 알림 수신:', event);
  
  const options = {
    body: event.data ? event.data.text() : '새로운 휴가 일정이 있습니다.',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'view',
        title: '확인하기'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('휴가 관리 시스템', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', event => {
  console.log('🔔 알림 클릭:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// 유틸리티 함수들
async function syncVacationData() {
  try {
    // IndexedDB에서 오프라인 중에 저장된 데이터 가져오기
    const offlineData = await getOfflineData();
    
    if (offlineData.length > 0) {
      // 서버에 데이터 전송
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(offlineData)
      });
      
      if (response.ok) {
        // 동기화 성공 시 오프라인 데이터 삭제
        await clearOfflineData();
        console.log('✅ 백그라운드 동기화 완료');
      }
    }
  } catch (error) {
    console.error('❌ 백그라운드 동기화 실패:', error);
  }
}

async function getOfflineData() {
  // IndexedDB에서 오프라인 데이터 조회
  // 실제 구현 시 IndexedDB API 사용
  return [];
}

async function clearOfflineData() {
  // IndexedDB에서 오프라인 데이터 삭제
  // 실제 구현 시 IndexedDB API 사용
}

// 캐시 크기 관리
async function cleanupCaches() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    if (cacheName.startsWith('vacation-dynamic')) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      // 100개 이상의 캐시가 있으면 오래된 것부터 삭제
      if (requests.length > 100) {
        const toDelete = requests.slice(0, requests.length - 100);
        for (const request of toDelete) {
          await cache.delete(request);
        }
        console.log(`🧹 ${toDelete.length}개의 오래된 캐시 삭제됨`);
      }
    }
  }
}

// 주기적으로 캐시 정리
setInterval(cleanupCaches, 24 * 60 * 60 * 1000); // 24시간마다