# Fase 3 — Subida y organización

## Objetivo
Reducir la fricción del flujo de subida y hacer que los álbumes sean algo que la gente realmente use.

---

## 1. FAB de upload en el feed

**Qué:** Reemplazar el tab "Subir" del nav por un FAB (floating action button) en la esquina inferior derecha del feed. El nav queda con solo: Feed / Albums / Perfil.

**Por qué:** El tab de upload implica dejar el feed. El FAB es una acción contextual que puede disparar un sheet sin abandonar la pantalla.

**Comportamiento en mobile:**
- FAB circular `+` en bottom-right (sobre el nav)
- Al tocar, abre un bottom sheet de upload encima del feed
- El sheet tiene el mismo `UploadZone` actual pero inline

**Comportamiento en desktop:**
- FAB en la misma posición o simplemente un botón en el header del feed
- Al hacer click, abre un modal centrado

**Cambios en nav:**
- `AppNav.tsx`: eliminar tab "Subir", quedan 3 tabs (Feed / Albums / Perfil)
- La ruta `/:groupId/upload` puede quedarse para acceso directo pero no es el flujo principal

**UI del sheet:**
- Componente nuevo `UploadSheet.tsx` — wrappea `UploadZone` con el chrome del sheet (handle, título, close)
- Estado gestionado en el layout del grupo o en el feed page como `useState<boolean>`

---

## 2. Metadata durante la subida

**Qué:** En el flow de upload, permitir asignar álbum y título a las fotos antes de confirmar.

**UI approach — dos opciones:**

**Opción A — Metadata global (un solo álbum para todo el batch):**
- Sobre el drop zone, dos campos opcionales: "Álbum" (texto libre o selector) y "Título" (opcional)
- Todo el batch de fotos se sube con esos metadatos
- Simple, rápido, útil para "estoy subiendo fotos del asado del sábado"

**Opción B — Metadata por foto:**
- Después de seleccionar los archivos, muestra una lista con cada foto y campos editables por foto
- Más potente pero más lento; mejor para uploads de 1-3 fotos

**Recomendación:** Implementar Opción A primero. Si hay demanda de B, se agrega después.

**Cambios en `UploadZone.tsx`:**
- Agregar inputs de álbum (text input con autocomplete de álbumes existentes en el grupo) y título encima del drop area
- Pasar esos valores al body del `POST /api/photos/upload`

**Cambios en `app/api/photos/upload/route.ts`:**
- Ya lee `album` y `title` del formData? Verificar. Si no, agregarlos al procesamiento de cada archivo.

---

## 3. Álbumes como tags (migración de schema)

**Qué:** Hoy `album` es un campo `TEXT` en `photos`. Esto no permite que una foto esté en múltiples álbumes y hace difícil renombrar álbumes. Migrar a una relación many-to-many.

**Schema nuevo:**

```ts
// lib/schema.ts — agregar:
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  groupId: text('group_id').notNull().references(() => groups.id),
  name: text('name').notNull(),
})

export const photoTags = sqliteTable('photo_tags', {
  photoId: text('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({ pk: primaryKey({ columns: [t.photoId, t.tagId] }) }))
```

**Migración de datos:**
- Script de migración que lee el campo `photos.album` existente, crea registros en `tags` y `photo_tags`, y luego puede dejar el campo viejo o dropearlo
- Drizzle tiene migraciones con `drizzle-kit` — generar y aplicar

**Implicaciones en la app:**
- Queries de álbumes: en lugar de `GROUP BY photos.album`, hacer JOIN con `photo_tags` y `tags`
- Vista de álbumes `/:groupId/albums/page.tsx`: refactor para usar el nuevo schema
- Upload: al asignar álbum, crear tag si no existe (upsert por nombre+groupId) y luego photo_tag
- Puede haber un álbum llamado igual que otro → decidir si los tags son únicos por nombre dentro del grupo (sí, tiene sentido)

**Nota:** Esta es la tarea más compleja de la fase. Se puede hacer después de la 1 y 2, y es la única que requiere migración de datos existentes.

---

## Archivos a tocar

| Archivo | Cambio |
|---|---|
| `components/AppNav.tsx` | Eliminar tab Upload |
| `app/(app)/[groupId]/page.tsx` | Agregar FAB + estado del sheet |
| `components/UploadSheet.tsx` | Crear — bottom sheet wrapeando UploadZone |
| `components/UploadZone.tsx` | Agregar inputs de álbum + título (Opción A) |
| `app/api/photos/upload/route.ts` | Leer y guardar album/title del body |
| `lib/schema.ts` | Agregar `tags` y `photo_tags` |
| `lib/relations.ts` | Agregar relaciones para tags |
| `app/(app)/[groupId]/albums/page.tsx` | Refactor para usar nuevo schema de tags |
| `drizzle.config.ts` | Verificar config de migraciones |

## Orden de implementación sugerido
1. FAB + UploadSheet (independiente del schema, 45 min)
2. Metadata en upload — Opción A (30 min)
3. Migración de schema de álbumes (60 min — más complejo, hacerlo último)
