const CACHE_NAME = "macrocalc-v1";

// Файлы для кэширования
const urlsToCache = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/favicon.ico",
  "/food-fusilli-pasta-reginette-svgrepo-com.svg",
  "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js",
];

// Установка сервис-воркера и кэширование файлов
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }),
  );
});

// Обработка запросов: сначала сеть, потом кэш (стратегия Stale-While-Revalidate)
self.addEventListener("fetch", (event) => {
  // Пропускаем запросы к API и внешним ресурсам, которые не нужно кэшировать агрессивно
  if (event.request.url.includes("openfoodfacts.org")) {
    // Для API используем только сеть
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Обновляем кэш новым ответом
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Если сеть недоступна и есть кэш, возвращаем его
          if (cachedResponse) {
            return cachedResponse;
          }
          // Если ничего нет, возвращаем офлайн-страницу (опционально)
          return caches.match("/index.html");
        });

      // Возвращаем кэш немедленно, но обновляем в фоне
      return cachedResponse || fetchPromise;
    }),
  );
});

// Активация и очистка старых кэшей
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
