// Service worker: app shell cached for offline; data fetched network-first so
// the guide stays current (falls back to cache when offline).
const SHELL = 'woc-shell-v15';
const DATA = 'woc-data-v1';
const SHELL_FILES = ['./', 'index.html', 'app.js?v=15', 'styles.css?v=15', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== DATA).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === location.origin;
  const isShell = sameOrigin && /\.(html|js|css)(\?|$)|\/$/.test(url.pathname + url.search);

  if (isShell) {
    // stale-while-revalidate for the app shell
    e.respondWith(caches.open(SHELL).then(async c => {
      const cached = await c.match(req, { ignoreSearch: false });
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => cached);
      return cached || net;
    }));
    return;
  }
  // data + assets (json, md, svg, png from raw, etc.): network-first, cache fallback
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const cp = r.clone(); caches.open(DATA).then(c => c.put(req, cp)); }
    return r;
  }).catch(() => caches.match(req)));
});
