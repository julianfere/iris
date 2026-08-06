import { db } from './db'
import { photos, photoTags, tags } from './schema'
import { eq, and, inArray, sql, type SQL } from 'drizzle-orm'

/**
 * Canonical order for a *collection* of photos (a person's roll, an album, a
 * filtered result set): capture date, newest first.
 *
 * `taken_at` is what the photo means to the viewer; `created_at` is only when
 * the file happened to reach the server. Uploads run concurrently, so within a
 * single batch `created_at` is decided by whichever file finished Sharp first —
 * effectively file size, not chronology. `created_at` is the tie-break so the
 * order stays stable for photos shot in the same second.
 */
export const collectionOrder = sql`COALESCE(${photos.takenAt}, ${photos.createdAt}) DESC, ${photos.createdAt} DESC`

export type PhotoFilterParams = {
  q: string
  tags: string[]
  userIds: string[]
}

function toArray(val: string | string[] | undefined): string[] {
  if (!val) return []
  return typeof val === 'string' ? [val] : val
}

export function parseFilterParams(sp: Record<string, string | string[] | undefined>): PhotoFilterParams {
  return {
    q: (typeof sp.q === 'string' ? sp.q : (sp.q?.[0] ?? '')).trim(),
    tags: toArray(sp.tag).filter(Boolean),
    userIds: toArray(sp.userId).filter(Boolean),
  }
}

export function hasActiveFilter(f: PhotoFilterParams): boolean {
  return f.q !== '' || f.tags.length > 0 || f.userIds.length > 0
}

/** Ordered photo ids matching the filter (newest capture first). Same order used to render search results. */
export function filteredPhotoIds(f: PhotoFilterParams): string[] {
  const conditions: SQL[] = []

  if (f.userIds.length > 0) {
    conditions.push(inArray(photos.userId, f.userIds))
  }
  if (f.q) {
    conditions.push(sql`LOWER(${photos.title}) LIKE LOWER(${'%' + f.q + '%'})`)
  }
  if (f.tags.length > 0) {
    const matchingIds = db
      .selectDistinct({ photoId: photoTags.photoId })
      .from(photoTags)
      .innerJoin(tags, and(eq(photoTags.tagId, tags.id), inArray(tags.name, f.tags)))
      .all()
      .map(r => r.photoId)
    if (matchingIds.length === 0) return []
    conditions.push(inArray(photos.id, matchingIds))
  }

  return db
    .select({ id: photos.id })
    .from(photos)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(collectionOrder)
    .all()
    .map(r => r.id)
}

/** Builds the querystring (no leading `?`) that carries a filter across navigation. Empty if no filter active. */
export function filterQueryString(f: PhotoFilterParams): string {
  const p = new URLSearchParams()
  if (f.q) p.set('q', f.q)
  f.tags.forEach(t => p.append('tag', t))
  f.userIds.forEach(u => p.append('userId', u))
  return p.toString()
}
