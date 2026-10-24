// Офлайн-режим: кэшируем оболочку и всё, что приложение загрузило.
const CACHE = 'mathkids-v2';
const IMAGES = ['./img/openmoji/1F333.svg', './img/openmoji/1F34A.svg', './img/openmoji/1F34E.svg', './img/openmoji/1F350.svg', './img/openmoji/1F353.svg', './img/openmoji/1F36A.svg', './img/openmoji/1F381.svg', './img/openmoji/1F388.svg', './img/openmoji/1F41F.svg', './img/openmoji/1F424.svg', './img/openmoji/1F427.svg', './img/openmoji/1F42D.svg', './img/openmoji/1F430.svg', './img/openmoji/1F431.svg', './img/openmoji/1F436.svg', './img/openmoji/1F43B.svg', './img/openmoji/1F43C.svg', './img/openmoji/1F4DA.svg', './img/openmoji/1F686.svg', './img/openmoji/1F955.svg', './img/openmoji/1F989.svg', './img/openmoji/1F98A.svg', './img/openmoji/1F994.svg', './img/openmoji/26BD.svg', './img/openmoji/2B50.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['./', './index.html', './manifest.webmanifest', './icon.svg', ...IMAGES])),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Страница: сначала сеть, чтобы получать обновления; без сети — из кэша.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html')),
    );
    return;
  }

  // Скрипты, стили, картинки: из кэша, иначе из сети с сохранением.
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});

// Страница присылает адреса уже загруженных скриптов и стилей, чтобы они были доступны офлайн с первого запуска.
self.addEventListener('message', (event) => {
  const urls = event.data && event.data.type === 'cache-urls' ? event.data.urls : null;
  if (!Array.isArray(urls)) return;
  const own = urls.filter((u) => typeof u === 'string' && new URL(u).origin === self.location.origin);
  event.waitUntil(caches.open(CACHE).then((c) => Promise.all(own.map((u) => c.add(u).catch(() => undefined)))));
});
