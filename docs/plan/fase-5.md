# Fase 5 — PWA

## Objetivo
Que Carrete se pueda instalar como app nativa en el home screen y se sienta nativa. Es el cierre natural de las fases anteriores.

---

## 1. Web App Manifest

**Qué:** Archivo `public/manifest.json` que describe la app para los browsers.

```json
{
  "name": "Carrete",
  "short_name": "Carrete",
  "description": "Fotos sin compresión, solo tu gente",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0e0e10",
  "theme_color": "#0e0e10",
  "orientation": "portrait",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

**En `app/layout.tsx`:**
```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#0e0e10" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="apple-touch-icon" href="/icon-192.png" />
```

**Íconos a crear:** `public/icon-192.png` y `public/icon-512.png` — diseño minimalista con el punto rojo característico del logo "●".

---

## 2. Service Worker básico

**Qué:** Cache de los assets estáticos y thumbnails ya vistos. No offline-first completo, solo mejorar la velocidad percibida en revisitas.

**Estrategia:**
- Assets estáticos (JS/CSS/fonts): `Cache First` — se sirven del cache si existen
- Thumbnails (`/api/photos/*/thumb`): `Stale While Revalidate` — sirve del cache y actualiza en background
- API calls, páginas: `Network First` — siempre intenta red, cache como fallback

**Implementación:**
- `public/sw.js` — service worker manual (sin Workbox para mantenerlo simple)
- Registrar en `app/layout.tsx` con un script inline o en un Client Component `<ServiceWorkerRegistration />`

**Scope del cache:**
```js
const STATIC_CACHE = 'carrete-static-v1'
const THUMB_CACHE = 'carrete-thumbs-v1'

// En fetch handler:
if (url.pathname.includes('/api/photos/') && url.pathname.endsWith('/thumb')) {
  // Stale While Revalidate
}
```

**Nota:** Next.js con App Router tiene su propio sistema de cache de assets. El SW solo necesita manejar thumbnails y assets que Next no controla.

---

## 3. Push notifications (opcional, scope reducido)

**Qué:** Notificar al usuario cuando alguien sube fotos a un grupo en el que está.

**Stack:**
- Web Push API + VAPID keys
- Backend: guardar suscripciones push en una tabla nueva `push_subscriptions`
- Trigger: al completar un upload exitoso, enviar notificación a todos los miembros del grupo (excepto quien subió)

**Schema:**
```ts
export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
```

**Libs:** `web-push` (npm) para enviar desde el server con VAPID.

**UX del permiso:**
- No pedir el permiso inmediatamente al entrar a la app — eso es lo más molesto posible
- Pedir después de que el usuario suba su primera foto o entre al feed por segunda vez
- Mensaje claro: "¿Querés que te avisemos cuando alguien suba fotos?"

**Esta parte es opcional** — las fases 1-4 ya le dan mucho valor a la app. Las notificaciones agregan complejidad de server (VAPID keys, envíos async) que requiere más infraestructura si la app escala. Evaluar según el deployment actual (Docker local vs. hosted).

---

## Archivos a tocar

| Archivo | Cambio |
|---|---|
| `public/manifest.json` | Crear |
| `public/icon-192.png`, `public/icon-512.png` | Crear (diseño del ícono) |
| `public/sw.js` | Crear |
| `app/layout.tsx` | Agregar meta tags de PWA + registro del SW |
| `lib/schema.ts` | Agregar `push_subscriptions` (si se hace notificaciones) |
| `app/api/push/` | Crear endpoints para suscribir/desuscribir (si se hace notificaciones) |

## Consideraciones de deployment
- El service worker requiere HTTPS (o localhost). Verificar que el Docker setup tenga esto cubierto en producción.
- VAPID keys se generan una sola vez y se guardan en `.env`. No se pueden cambiar sin perder todas las suscripciones existentes.
- `web-push` funciona en Node.js pero no en Edge Runtime — el endpoint de envío tiene que ser `runtime: 'nodejs'`.

## Orden de implementación sugerido
1. Manifest + meta tags (20 min)
2. Íconos (tiempo variable según diseño)
3. Service Worker básico con cache de thumbs (45 min)
4. Push notifications (90 min+ — solo si se decide avanzar)
