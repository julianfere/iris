# Fase 1 — Gaps críticos

## Objetivo
Cerrar los huecos funcionales más urgentes. Sin estas cosas la app tiene fricciones bloqueantes.

---

## 1. Eliminar foto propia

**Qué:** Botón de eliminar en el detalle de foto, solo visible para el autor de la foto (o dueño del grupo).

**API:**
- `DELETE /api/photos/[id]` — verificar que `session.user.id === photo.userId` o `session.user.id === group.ownerId`
- Eliminar el registro de la DB, el archivo original en `./photos/`, y el thumb en `./photos/.thumbs/`
- Devolver `{ ok: true }` o error 403/404

**UI:**
- En `app/(app)/[groupId]/photo/[photoId]/page.tsx`, agregar un botón de trash visible solo si `isOwn || isGroupOwner`
- Al confirmar (alert nativo o pequeño confirm inline), llamar a la API y redirigir al feed `/:groupId`
- No usar modal elaborado, mantener simple

**Consideraciones:**
- Si la foto tiene favoritos, eliminar en cascada (ya manejado por FK con `ON DELETE CASCADE` si se configura, o delete manual de favorites primero)
- Revisar si `lib/schema.ts` tiene `onDelete: 'cascade'` en favorites → photos

---

## 2. Lista de miembros del grupo

**Qué:** Pantalla accesible desde dentro del grupo que muestra quién está en él.

**Route:** `app/(app)/[groupId]/members/page.tsx` (Server Component)

**Query:** JOIN de `groupMembers` + `users` para el groupId, ordenado por `joinedAt`

**UI:**
- Lista de cards: avatar (color o imagen) + nombre + fecha de ingreso
- Dueño del grupo marcado con un indicador sutil (no "admin", algo más discreto — ej. una estrella pequeña o "(creador)")
- Acceso: link desde el header del feed o desde la página de grupos

**Dónde poner el acceso:**
- En el header de `app/(app)/[groupId]/page.tsx` agregar un ícono de personas o el nombre del grupo como link a `/members`

---

## 3. Indicadores de actividad nueva en el hub de grupos

**Qué:** En la lista de grupos, mostrar cuántas fotos nuevas hay desde la última visita del usuario.

**Approach:** Guardar `lastVisitedAt` por usuario+grupo en una tabla nueva o en localStorage.

**Opción A — localStorage (más simple, no requiere DB):**
- Al entrar a `/:groupId`, guardar `localStorage.set('lastVisit_${groupId}', Date.now())`
- En el hub de grupos, comparar `photo.createdAt > lastVisit` del lado cliente
- Requiere un endpoint que devuelva la foto más reciente de cada grupo (ya está implícito en `/api/groups` o se puede agregar)

**Opción B — DB (más robusto, persiste entre dispositivos):**
- Nueva tabla `group_visits (userId, groupId, visitedAt)` — upsert al entrar al grupo
- Query en `/groups` hace JOIN para calcular `newPhotosCount`

**Recomendación:** Opción A para esta fase, migrar a B en la Fase 6 si hay multi-device.

**UI:**
- Badge numérico (ej. "5") o punto rojo en la card del grupo en `GroupsClient.tsx`
- Si son 0 nuevas, sin badge

---

## 4. Redirect inteligente desde la raíz

**Qué:** Si el usuario tiene exactamente 1 grupo, saltar el hub y ir directo al feed de ese grupo.

**Dónde:** `app/(app)/groups/page.tsx` (Server Component)

```ts
// Si hay exactamente 1 grupo, redirect directo
if (groups.length === 1) {
  redirect(`/${groups[0].id}`)
}
```

**Caso edge:** Si el usuario no tiene grupos, mostrar el hub con el CTA de crear/unirse (comportamiento actual).

---

## Archivos a tocar

| Archivo | Cambio |
|---|---|
| `lib/schema.ts` | Verificar/agregar `onDelete: 'cascade'` en favorites |
| `app/api/photos/[id]/route.ts` | Crear — DELETE handler |
| `app/(app)/[groupId]/photo/[photoId]/page.tsx` | Agregar botón eliminar condicional |
| `app/(app)/[groupId]/members/page.tsx` | Crear — lista de miembros |
| `app/(app)/[groupId]/page.tsx` | Link a /members en header |
| `app/(app)/groups/page.tsx` | Redirect inteligente |
| `app/(app)/groups/GroupsClient.tsx` | Badge de fotos nuevas |

## Orden de implementación sugerido
1. Redirect inteligente (10 min, muy bajo riesgo)
2. DELETE foto (API + UI, 30 min)
3. Lista de miembros (30 min)
4. Indicadores de actividad (45 min — la más compleja)
