const CACHE_VER = 'dental-city-clinic-v54';
const urlsToCache = [
  '/dental_city/',
  '/dental_city/index.html',
  '/dental_city/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
];

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VER)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
      .catch(err => console.log('Cache install error:', err))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(versions => Promise.all(
        versions
          .filter(v => v !== CACHE_VER)
          .map(v => caches.delete(v))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin and non-GET
  if (url.origin !== location.origin && !url.hostname.includes('cdnjs') && !url.hostname.includes('googleapis') && !url.hostname.includes('unpkg')) {
    return;
  }
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request)
      .then(response => response || fetch(request)
        .then(res => {
          if (!res || res.status !== 200 || res.type === 'error') return res;
          const cloned = res.clone();
          caches.open(CACHE_VER).then(cache => cache.put(request, cloned));
          return res;
        })
        .catch(() => caches.match('/dental_city/index.html'))
      )
  );
});
