// Service worker: network-first for everything so online visitors always get
// the latest build; cached copies are kept only as an offline fallback. The
// shell is precached on install so the app still opens with no connection.
const CACHE = 'woc-v123';
const SHELL_FILES = ['./', 'index.html', 'app.js?v=116', 'styles.css?v=116', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Only handle same-origin requests. Never intercept cross-origin ones (CDN assets,
  // the HuggingFace model weights for the in-browser AI, raw.githubusercontent data):
  // wrapping them can hand back redirected/opaque responses that break Cache.add/put
  // ("encountered a network error"), and we'd otherwise try to cache hundreds of MB of
  // model shards. Let the browser fetch those natively.
  if (new URL(req.url).origin !== self.location.origin) return;
  // network-first: fresh when online, fall back to cache when offline
  e.respondWith(
    fetch(req).then(r => {
      if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
