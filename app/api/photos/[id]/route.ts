import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos, favorites, tags, photoTags } from '@/lib/schema'
import { photoPath, thumbPath } from '@/lib/photos'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import fs from 'fs/promises'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const photo = db.select().from(photos).where(eq(photos.id, id)).get()
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (photo.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json() as { title?: string; tags?: string[]; downloadable?: boolean }

  const newTitle = typeof body.title === 'string' ? body.title.trim() || null : photo.title
  const newDownloadable = typeof body.downloadable === 'boolean' ? (body.downloadable ? 1 : 0) : photo.downloadable
  const newTags = Array.isArray(body.tags)
    ? body.tags.map(t => t.trim().toLowerCase().replace(/\s+/g, '-')).filter(Boolean)
    : null

  db.update(photos).set({
    title: newTitle,
    downloadable: newDownloadable,
    album: newTags ? (newTags[0] ?? null) : photo.album,
  }).where(eq(photos.id, id)).run()

  if (newTags !== null) {
    db.delete(photoTags).where(eq(photoTags.photoId, id)).run()
    for (const tagName of newTags) {
      let tag = db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName)).get()
      if (!tag) {
        const tagId = crypto.randomUUID()
        db.insert(tags).values({ id: tagId, name: tagName }).run()
        tag = { id: tagId }
      }
      db.insert(photoTags).values({ photoId: id, tagId: tag.id }).onConflictDoNothing().run()
    }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const photo = db.select().from(photos).where(eq(photos.id, id)).get()
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (photo.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  db.delete(favorites).where(eq(favorites.photoId, id)).run()
  db.delete(photos).where(eq(photos.id, id)).run()

  await fs.unlink(photoPath(photo.filename)).catch(() => {})
  await fs.unlink(thumbPath(photo.filename)).catch(() => {})

  return NextResponse.json({ ok: true })
}
