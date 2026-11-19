/* Офлайн-кэш веб-версии «ЧПУ Оператор» */
const CACHE = 'cnc-operator-2.0.25';
const ASSETS = [
  './',
  'index.html',
  'style.css',
  'data.js',
  'app.js',
  'calc.js',
  'schemes.js',
  'tool-schemes.js',
  'toler.js',
  'thread.js',
  'tool.js',
  'metals.js',
  'refs.js',
  'machine.js',
  'sources.js',
  'updates.js',
  'about.js',
  'license.js',
  'bugreport.js',
  'arcade.js',
  'metrika.js',
  'webapp.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== location.origin) return;
  e.respondWith(
    caches.match(req, {ignoreSearch: true}).then(hit => {
      if(hit) return hit;
      return fetch(req).then(res => {
        if(res && res.status === 200 && res.type === 'basic'){
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match('index.html'));
    })
  );
});
