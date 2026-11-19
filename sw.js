const CACHE_VER = 'laundry-app-v1'; // bump this every time index.html changes
const urlsToCache = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_VER).then(c => c.addAll(urlsToCache)).catch(err => console.log('Cache install error:', err)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(v => Promise.all(v.filter(x => x !== CACHE_VER).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (url.origin !== location.origin && !url.hostname.includes('googleapis') && !url.hostname.includes('gstatic')) return; // never cache Supabase calls
  if (req.mode === 'navigate') {   // network-first so staff always get the newest version
    e.respondWith(fetch(req).then(res => { if (res && res.status === 200) { const c = res.clone(); caches.open(CACHE_VER).then(k => k.put('./index.html', c)); } return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    if (res && res.status === 200) { const c = res.clone(); caches.open(CACHE_VER).then(k => k.put(req, c)); }
    return res;
  }).catch(() => Response.error())));
});
