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
