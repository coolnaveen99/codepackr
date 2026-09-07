const CACHE_NAME = 'codepackr-v4';
const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/site.webmanifest',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('[SW] Precache skipped for some items:', err);
      });
    })
  );
  self.skipWaiting();
});

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
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Skip caching third-party analytics, ads, syndication, and internal APIs
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api') ||
    url.hostname.includes('googlesyndication') ||
    url.hostname.includes('google-analytics') ||
    url.hostname.includes('googletagmanager') ||
    url.hostname.includes('clarity.ms')
  ) {
    return;
  }

  const isNavigation = request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html');

  if (isNavigation) {
    // Navigation requests: Network-first without conditional headers to prevent empty 304 responses on browser refresh
    event.respondWith(
      (async () => {
        try {
          const fetchHeaders = new Headers(request.headers);
          fetchHeaders.delete('if-none-match');
          fetchHeaders.delete('if-modified-since');

          const networkResponse = await fetch(request.url, {
            method: 'GET',
            headers: fetchHeaders,
            credentials: request.credentials,
          });

          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
            return networkResponse;
          }

          // If network returned 304 or non-200, return from cache
          const cached = await caches.match(request);
          if (cached) {
            return cached;
          }

          // SPA shell fallback
          const fallbackIndex = (await caches.match('/index.html')) || (await caches.match('/'));
          if (fallbackIndex) {
            return fallbackIndex;
          }

          if (networkResponse) {
            return networkResponse;
          }
        } catch (err) {
          // Network failure or offline
          const cached = (await caches.match(request)) ||
                         (await caches.match('/index.html')) ||
                         (await caches.match('/'));
          if (cached) {
            return cached;
          }

          return new Response(
            '<!doctype html><html><head><meta charset="utf-8"><title>Codepackr</title><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:system-ui,-apple-system,sans-serif;text-align:center;padding:48px 20px;background:#f8fafc;color:#0f172a;"><h2 style="font-size:1.5rem;font-weight:700;margin-bottom:12px;">Codepackr is temporarily offline</h2><p style="color:#64748b;margin-bottom:24px;">Please check your connection and reload.</p><button onclick="location.reload()" style="background:#5B52E8;color:#ffffff;border:none;border-radius:12px;padding:12px 24px;font-weight:600;cursor:pointer;">Reload Page</button></body></html>',
            {
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
          );
        }

        const fallback = (await caches.match('/index.html')) || (await caches.match('/'));
        if (fallback) return fallback;

        return new Response('Not Found', { status: 404, statusText: 'Not Found' });
      })()
    );
    return;
  }

  // Static Assets (JS, CSS, Images, Fonts)
  event.respondWith(
    (async () => {
      // For content-hashed assets in /assets/, serve from cache if available
      const isHashedAsset = url.pathname.startsWith('/assets/');
      if (isHashedAsset) {
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }
      }

      try {
        const networkResponse = await fetch(request);

        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        }

        if (networkResponse && networkResponse.status === 304) {
          const cached = await caches.match(request);
          if (cached) return cached;
        }

        if (networkResponse) {
          return networkResponse;
        }
      } catch (err) {
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }
      }

      const cachedFallback = await caches.match(request);
      if (cachedFallback) {
        return cachedFallback;
      }

      return new Response('Resource unavailable', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'text/plain' }
      });
    })()
  );
});
