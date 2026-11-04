// Hasuka Dimsum POS - Service Worker for Offline PWA Support
const CACHE_NAME = 'hasuka-pos-v3';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Dapatkan basis URL sesuai scope registrasi Service Worker (mendukung subfolder hosting seperti /POS-Hasuka-Dimsum/)
      const scopeUrl = new URL(self.registration.scope);
      const precacheUrls = [
        scopeUrl.href,
        new URL('index.html', scopeUrl).href,
        new URL('Hasuka-logo.png', scopeUrl).href,
        new URL('manifest.json', scopeUrl).href
      ];
      return cache.addAll(precacheUrls).catch((err) => {
        console.warn('[SW] Precache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Hanya proses request GET di origin yang sama
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Khusus dokumen navigasi (HTML / page reload saat offline)
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const scopeUrl = new URL(self.registration.scope);
          const cachedIndex = await caches.match(new URL('index.html', scopeUrl).href);
          if (cachedIndex) return cachedIndex;
          const cachedRoot = await caches.match(scopeUrl.href);
          if (cachedRoot) return cachedRoot;
          return new Response('<!DOCTYPE html><html><body><h1>Hasuka POS Offline</h1></body></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // Untuk aset statis (JS, CSS, Font, Gambar): Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(() => cachedRes);

      return cachedRes || fetchPromise;
    })
  );
});
