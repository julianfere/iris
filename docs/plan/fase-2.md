# Fase 2 — Experiencia de visualización

## Objetivo
Que ver fotos se sienta fluido y nativo. El flujo actual (page navigation completa por cada foto) es el punto de dolor más visible en mobile.

---

## 1. Photo overlay / viewer

**Qué:** Reemplazar la navegación a `/:groupId/photo/:photoId` por un overlay que se abre sobre el feed. El feed queda montado detrás, preservando el scroll.

**Approach:**
- Componente cliente `PhotoOverlay.tsx` — full-screen overlay con fondo oscuro semi-transparente
- Se activa al hacer click en cualquier foto del feed
- La URL **sí cambia** (`/:groupId/photo/:photoId`) para que el deep link siga funcionando — usar `router.push` shallow o intercepting routes de Next.js App Router

**Implementación con Intercepting Routes (Next.js):**
```
app/(app)/[groupId]/
  @modal/           ← parallel route para el overlay
    (.)photo/
      [photoId]/
        page.tsx    ← versión overlay (modal)
  photo/
    [photoId]/
      page.tsx      ← versión full-page (para acceso directo por URL)
```

Esto permite:
- Click en feed → overlay (URL cambia, back cierra el overlay)
- Acceso directo por URL → full-page (para compartir links)

**UI del overlay:**
- Imagen centrada, máximo viewport height
- Sidebar de metadata a la derecha en desktop, debajo en mobile (igual que ahora pero como overlay)
- Botón X para cerrar (o click fuera del contenido)
- Fondo oscuro con blur sutil del feed detrás

---

## 2. Swipe entre fotos

**Qué:** Dentro del overlay, deslizar izquierda/derecha navega a la foto anterior/siguiente en el feed cronológico del grupo.

**Approach:**
- El overlay recibe la lista ordenada de `photoIds` del feed (pasada como contexto o query param)
- Detectar swipe con `touchstart`/`touchend` o una lib mínima (ej. `use-swipe` hook manual, sin dependencias extra)
- También botones prev/next visibles en desktop (flechas laterales)

**Orden de fotos:** Mismo orden que el feed (cronológico descendente). El overlay necesita saber su posición en la lista para habilitar/deshabilitar prev/next.

**Pasar la lista:**
- Opción A: Context de React que el feed popula con los IDs en orden
- Opción B: Query param `?from=feed` con los IDs serializados (no escala bien con muchas fotos)
- **Recomendación:** Opción A — un `PhotoFeedContext` liviano que solo guarda `photoIds: string[]`

**Preload:** Al estar en foto N, precargar el thumb de N+1 con `<link rel="preload">` o un `new Image()` manual.

---

## 3. EXIF colapsable

**Qué:** La tabla de datos técnicos empieza colapsada con un toggle "Ver datos técnicos / Ocultar".

**Dónde:** En la vista de detalle de foto (tanto overlay como full-page), debajo de la info básica (autor, fecha, título).

**UI:**
- Línea divisoria + botón de texto con chevron rotante
- Primer `render`: colapsado por defecto
- Estado local (`useState`), no persistido — cada vez que abrís una foto empieza colapsado

**Qué siempre se muestra (fuera del collapse):**
- Autor + avatar
- Fecha tomada
- Cámara + lente (si existe) — una línea de resumen tipo "Sony A7 IV · 35mm f/1.4"
- Favoritos

**Qué va dentro del collapse:**
- Toda la tabla EXIF detallada (velocidad, ISO, exposición, GPS, etc.)

---

## Archivos a tocar

| Archivo | Cambio |
|---|---|
| `app/(app)/[groupId]/page.tsx` | Hacer fotos clickeables hacia overlay; poblar PhotoFeedContext |
| `app/(app)/[groupId]/@modal/(.)photo/[photoId]/page.tsx` | Crear — versión overlay |
| `app/(app)/[groupId]/layout.tsx` | Crear (o modificar) para incluir el slot `@modal` |
| `app/(app)/[groupId]/photo/[photoId]/page.tsx` | Mantener para acceso directo por URL; refactor EXIF colapsable |
| `components/PhotoOverlay.tsx` | Crear — wrapper del overlay con swipe |
| `components/PhotoFeedContext.tsx` | Crear — context liviano con lista de IDs |

## Consideraciones
- Los intercepting routes de Next.js App Router son la solución idiomática para esto; vale la pena el setup aunque sea un poco verboso
- Si el setup de parallel routes resulta demasiado complejo, plan B: overlay puramente cliente sin cambio de URL (menos correcto pero más simple)
- Swipe en desktop no aplica; ahí van las flechas laterales

## Orden de implementación sugerido
1. EXIF colapsable (independiente, 20 min)
2. PhotoFeedContext (base para el swipe, 20 min)
3. Intercepting route + overlay (45 min)
4. Swipe + prev/next (30 min)
