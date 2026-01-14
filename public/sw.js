// Service Worker для автоматического обновления приложения
const CACHE_NAME = 'zachot-v1';
const VERSION_CHECK_INTERVAL = 60000; // Проверять каждую минуту

// При установке Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting(); // Активировать немедленно
});

// При активации
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Проверка версии приложения
async function checkForUpdates() {
  try {
    const response = await fetch('/version.json', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (response.ok) {
      const data = await response.json();
      const currentVersion = await getCachedVersion();
      
      if (currentVersion && currentVersion !== data.version) {
        console.log('[SW] New version detected:', data.version);
        // Очищаем кэш
        await caches.delete(CACHE_NAME);
        // Уведомляем всех клиентов об обновлении
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            version: data.version
          });
        });
      } else {
        await setCachedVersion(data.version);
      }
    }
  } catch (error) {
    console.error('[SW] Version check failed:', error);
  }
}

// Сохранение версии в IndexedDB
async function setCachedVersion(version) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put('/cached-version', new Response(version));
}

// Получение версии из IndexedDB
async function getCachedVersion() {
  const cache = await caches.open(CACHE_NAME);
  const response = await cache.match('/cached-version');
  return response ? await response.text() : null;
}

// Периодическая проверка обновлений
setInterval(checkForUpdates, VERSION_CHECK_INTERVAL);

// Обработка fetch запросов
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Для HTML файлов - всегда network first
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Для API запросов - только network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Для остальных ресурсов - cache first, но с проверкой обновлений
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Кэшируем только успешные ответы
        if (networkResponse.ok) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
      
      return cachedResponse || fetchPromise;
    })
  );
});

