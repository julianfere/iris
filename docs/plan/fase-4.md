# Fase 4 — Compartir y descubrir

## Objetivo
Hacer más fácil traer gente nueva al grupo y explorar el contenido por autor.

---

## 1. Botón "Compartir grupo" con share sheet + QR

**Qué:** Un botón en la página de grupos (y/o en el header del feed) que permite compartir el código de invitación de forma nativa.

**Comportamiento:**

**En mobile (PWA/browser que soporta `navigator.share`):**
```ts
await navigator.share({
  title: `Unirse a ${group.name} en Carrete`,
  text: `Código de invitación: ${group.inviteCode}`,
  url: `https://carrete.app/join/${group.inviteCode}` // deep link
})
```
- Dispara el share sheet nativo del sistema operativo (WhatsApp, iMessage, etc.)
- Sin instalar nada extra

**Fallback (desktop o browsers sin `navigator.share`):**
- Mostrar un pequeño popover con:
  - El código copiable con un click (copy to clipboard)
  - Un QR code generado en el cliente a partir del código de invitación

**QR code:** Usar una lib liviana como `qrcode` (npm) que genera un canvas/SVG del lado cliente. No necesita server.

**Deep link:**
- Agregar una ruta `app/(auth)/join/[code]/page.tsx` que, si el usuario está logueado, lo une automáticamente al grupo y redirige al feed. Si no está logueado, redirige a login con el code guardado en una cookie.

**Dónde poner el botón:**
- En `GroupsClient.tsx`, en la card de cada grupo (ícono de compartir)
- Opcionalmente también en el header del feed `/:groupId` (ícono compartir junto al nombre del grupo)

---

## 2. Filtrar feed por miembro

**Qué:** Al tocar el avatar del autor de una foto en el feed, filtrar el feed para mostrar solo las fotos de ese usuario en el grupo.

**Approach:**
- Agregar query param `?userId=:id` al feed `/:groupId?userId=xxx`
- El Server Component lee el param y agrega `where(photos.userId, userId)` a la query
- Al estar filtrado, mostrar un banner/chip "Fotos de [Nombre] · ver todas" con link para limpiar el filtro
- El mismo approach aplica a la vista de álbumes

**UI:**
- Avatar clickeable en las cards de foto del feed (ya existen, solo hacerlos links)
- Chip de filtro activo en la parte superior del feed cuando hay un filtro aplicado
- Botón X en el chip para limpiar

**No hacer un search general por ahora** — el filtro por autor cubre el 80% del caso de uso sin complejidad extra.

---

## 3. Selector de grupo accesible desde dentro de la app

**Qué:** Sin salir del grupo activo, poder cambiar a otro grupo.

**Approach liviano:**
- En el header del feed, el nombre del grupo es un dropdown (si hay más de 1 grupo)
- Al hacer click en el nombre, despliega la lista de grupos del usuario
- Seleccionar uno navega a `/:otroGroupId`
- Si el usuario tiene un solo grupo, el nombre no es interactivo (no tiene sentido)

**UI:**
- Header actual: `[← back] NombreGrupo [iconos]`
- Header nuevo: `[← back] NombreGrupo ▾ [iconos]` — el nombre es un trigger de popover
- El popover lista los grupos con badge de actividad nueva (vincula con Fase 1)

**Alternativa más simple:** Que el ícono de "back" en el header del feed siempre lleve a `/groups`, y en `/groups` aparecen los grupos con badges de actividad. No agrega complejidad al header.

**Recomendación:** La alternativa simple primero; el dropdown solo si el feedback indica que los usuarios tienen muchos grupos y el hub se siente lento.

---

## Archivos a tocar

| Archivo | Cambio |
|---|---|
| `app/(app)/groups/GroupsClient.tsx` | Agregar botón compartir por grupo |
| `components/GroupShareButton.tsx` | Crear — share sheet + QR fallback |
| `app/(auth)/join/[code]/page.tsx` | Crear — deep link de invitación |
| `app/(app)/[groupId]/page.tsx` | Filtro por userId via query param; header con link back a groups |
| `middleware.ts` | Asegurarse que `/join/[code]` no requiera auth o maneje el redirect correctamente |

## Dependencias externas
- `qrcode` (npm, ~15KB) para generar el QR en el cliente
- `navigator.share` — API nativa, no requiere lib

## Orden de implementación sugerido
1. Deep link `/join/[code]` + share button con clipboard fallback (40 min)
2. QR code en el fallback (20 min con lib)
3. Filtro por miembro en el feed (30 min)
4. Grupo switcher en header si se necesita (30 min)
