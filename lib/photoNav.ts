import { db } from './db'
import { photos } from './schema'
import { desc } from 'drizzle-orm'
import { hasActiveFilter, filteredPhotoIds, type PhotoFilterParams } from './photoFilter'

/** All photo ids, newest first — matches the default feed order. */
function allPhotoIdsOrdered(): string[] {
  return db
    .select({ id: photos.id })
    .from(photos)
    .orderBy(desc(photos.createdAt))
    .all()
    .map(r => r.id)
}

export type PhotoNav = {
  prevId: string | null
  nextId: string | null
  index: number
  total: number
}

/**
 * prev/next relative to the list the user was actually browsing: the active
 * search/tag/person filter if one was applied, otherwise the whole feed.
 * Keeps the viewer's arrows in sync with whatever grid the photo was opened from.
 */
export function computePhotoNav(photoId: string, filter: PhotoFilterParams): PhotoNav {
  const ids = hasActiveFilter(filter) ? filteredPhotoIds(filter) : allPhotoIdsOrdered()
  const idx = ids.indexOf(photoId)
  if (idx === -1) return { prevId: null, nextId: null, index: 0, total: ids.length }
  return {
    prevId: idx > 0 ? ids[idx - 1] : null,
    nextId: idx < ids.length - 1 ? ids[idx + 1] : null,
    index: idx,
    total: ids.length,
  }
}
