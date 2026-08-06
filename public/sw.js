const STATIC_CACHE = 'carrete-static-v1'
const THUMB_CACHE  = 'carrete-thumbs-v1'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== THUMB_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // Only handle same-origin GET requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // Thumbnails — Stale While Revalidate
  if (url.pathname.match(/^\/api\/photos\/[^/]+\/thumb$/)) {
    e.respondWith(staleWhileRevalidate(THUMB_CACHE, request))
    return
  }

  // Next.js static assets — Cache First
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(cacheFirst(STATIC_CACHE, request))
    return
  }
})

async function cacheFirst(cacheName, request) {
  const cache  = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  const fresh = await fetch(request)
  if (fresh.ok) cache.put(request, fresh.clone())
  return fresh
}

async function staleWhileRevalidate(cacheName, request) {
  const cache  = await caches.open(cacheName)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request).then(fresh => {
    if (fresh.ok) cache.put(request, fresh.clone())
    return fresh
  })
  return cached ?? fetchPromise
}

self.addEventListener('push', event => {
  let data = {}
  try { data = event.data?.json() ?? {} } catch { data = { title: event.data?.text() ?? 'Iris' } }
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Iris', {
      body: data.body ?? '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: data.url ?? '/global' },
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = event.notification.data?.url ?? '/global'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (!c.url.startsWith(self.location.origin)) continue
        // Se navega ANTES de enfocar: antes solo hacia focus(), asi que tocar
        // la notificacion te dejaba donde estabas en vez de llevarte a la foto.
        const url = new URL(target, self.location.origin).href
        return ('navigate' in c ? c.navigate(url) : Promise.resolve(c)).then(w => (w || c).focus())
      }
      return clients.openWindow(target)
    })
  )
})

// Purga de las miniaturas al cerrar sesion. THUMB_CACHE guarda respuestas
// marcadas Cache-Control: private, y no habia nada que las limpiara: en un
// dispositivo compartido, quien entraba despues podia leer las miniaturas del
// anterior desde el Cache Storage.
self.addEventListener('message', event => {
  if (event.data?.type === 'PURGE_PRIVATE_CACHE') {
    event.waitUntil(caches.delete(THUMB_CACHE))
  }
})
