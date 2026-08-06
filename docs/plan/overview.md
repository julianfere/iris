# Carrete — Plan de mejoras de usabilidad

Cinco fases ordenadas por impacto / esfuerzo. Cada una es independiente y deployable.
Ejecutar con `/start-phase <número>`.

---

## Fase 1 — Gaps críticos
> Lo que falta para que la app sea usable de verdad.

- Eliminar foto propia (API + botón en el detalle)
- Lista de miembros del grupo
- Indicadores de actividad nueva en el hub de grupos
- Redirect inteligente: si el usuario tiene un solo grupo, saltear el hub

**Archivos clave:** `app/(app)/[groupId]/photo/[photoId]/page.tsx`, `app/(app)/groups/page.tsx`, `app/api/photos/[id]/route.ts` (nuevo), `lib/schema.ts`

---

## Fase 2 — Experiencia de visualización
> Cómo se siente ver y explorar fotos.

- Overlay/drawer para foto en lugar de full-page navigation
- Swipe izquierda/derecha entre fotos del feed dentro del overlay
- EXIF colapsable ("Ver datos técnicos")

**Archivos clave:** `app/(app)/[groupId]/page.tsx`, `app/(app)/[groupId]/photo/[photoId]/page.tsx`, componente nuevo `PhotoOverlay.tsx`

---

## Fase 3 — Subida y organización
> Reducir fricción al momento de subir y organizar.

- FAB en el feed que abre upload sin salir de la pantalla
- Asignación de álbum y título durante la subida
- Migración de álbumes: campo string → tabla many-to-many `photo_tags`

**Archivos clave:** `components/UploadZone.tsx`, `app/api/photos/upload/route.ts`, `lib/schema.ts`, `app/(app)/[groupId]/page.tsx`

---

## Fase 4 — Compartir y descubrir
> Hacer más fácil traer gente y explorar el contenido.

- Botón "Compartir grupo" con share sheet nativo + fallback QR code
- Filtrar feed por miembro (tap en el avatar del autor)
- Selector de grupo accesible desde dentro de la app (header o nav)

**Archivos clave:** `app/(app)/groups/GroupsClient.tsx`, `app/(app)/[groupId]/page.tsx`, componente nuevo `GroupShareButton.tsx`

---

## Fase 5 — PWA
> Instalar como app y sentirla nativa.

- `manifest.json` con íconos, colores, orientación
- Service worker básico (cache de thumbnails ya vistos)
- Configuración de pantalla de inicio / splash
- (Opcional) Push notifications para fotos nuevas en grupos

**Archivos clave:** `public/manifest.json` (nuevo), `public/sw.js` (nuevo), `app/layout.tsx`

---

## Nota: repensar grupos (futuro)

No está en ninguna fase aún porque requiere más definición. Ideas en evaluación:

- Vista de actividad unificada entre grupos (timeline mezclado)
- Regenerar invite code (en caso de que se filtre)
- Grupos con nombre editable + foto de portada
- Roles (admin vs. miembro) para poder remover miembros

Cuando haya más claridad sobre qué dirección tomar, se agrega como Fase 6.
