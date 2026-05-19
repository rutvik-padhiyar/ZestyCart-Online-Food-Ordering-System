const CACHE_NAME = "zestycart-pwa-v2";
const APP_SHELL = ["/", "/manifest.json", "/images/fav.png", "/images/zesto.png"];

const isNavigationRequest = (request) => request.mode === "navigate";

const isCacheableAssetRequest = (request, url) => {
  if (url.origin !== self.location.origin) {
    return false;
  }

  if (url.pathname.startsWith("/api/")) {
    return false;
  }

  const destination = request.destination;
  return ["style", "script", "image", "font", "manifest", ""].includes(destination);
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.startsWith("/api/")) {
    return;
  }

  if (isNavigationRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/", responseClone));
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  if (!isCacheableAssetRequest(event.request, requestUrl)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match("/"));
    })
  );
});
