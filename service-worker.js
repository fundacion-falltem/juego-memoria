/* FALLTEM — Memoria: Service Worker (app shell + offline)
   Seguro con CSP: el SW vive en / y todo es same-origin. */

const SW_VERSION = 'v1.0.0';
const CACHE_NAME = `memoria-${SW_VERSION}`;
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  // Íconos recomendados
  './images/icon-192.png',
  './images/icon-512.png',
  './images/maskable-192.png',
  './images/maskable-512.png'
];

// Util para normalizar requests (ignora ?v=…) al hacer match
function normalize(request) {
  const url = new URL(request.url);
  url.search = ''; // ignorar parámetros
  return new Request(url.toString(), { headers: request.headers, method: request.method, mode: request.mode, credentials: request.credentials, redirect: request.redirect, referrer: request.referrer, referrerPolicy: request.referrerPolicy, integrity: request.integrity, cache: request.cache });
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL.map(u => new Request(u, { cache: 'no-store' })));
    // Activación inmediata si la página se lo pide
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Borra caches viejos
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k.startsWith('memoria-') && k !== CACHE_NAME) ? caches.delete(k) : null));
    await self.clients.claim();
  })());
});

// Mensaje opcional para “suave” actualización
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// Política:
// - Navegación (HTML): App Shell (index) -> siempre offline-friendly.
// - Demás (CSS/JS/imagenes): cache-first + revalidación en segundo plano.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Sólo manejamos same-origin
  if (url.origin !== self.location.origin) return;

  // Navegación: devolver el shell
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match('./index.html');
      if (cached) {
        // Revalidar en bg
        fetch('./index.html', { cache: 'no-store' }).then(r => r.ok && cache.put('./index.html', r.clone())).catch(()=>{});
        return cached;
      }
      // Si no hay cache, ir online y guardar
      try {
        const fresh = await fetch('./index.html', { cache: 'no-store' });
        if (fresh && fresh.ok) cache.put('./index.html', fresh.clone());
        return fresh;
      } catch {
        return new Response('<h1>Sin conexión</h1><p>Vuelve a intentarlo.</p>', { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 });
      }
    })());
    return;
  }

  // Estáticos (CSS/JS/img): cache-first con revalidación
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const normalized = normalize(request);
    const cached = await cache.match(normalized);
    if (cached) {
      // Revalida en bg
      fetch(request, { cache: 'no-store' })
        .then(resp => resp && resp.ok && cache.put(normalized, resp.clone()))
        .catch(()=>{});
      return cached;
    }
    try {
      const fresh = await fetch(request);
      if (fresh && fresh.ok) cache.put(normalized, fresh.clone());
      return fresh;
    } catch {
      // Fallback mínimo para imágenes rotas sin conexión
      if (request.destination === 'image') {
        return new Response('', { status: 200, headers: { 'Content-Type': 'image/png' } });
      }
      throw err;
    }
  })());
});
