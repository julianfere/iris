import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos, favorites } from '@/lib/schema'
import { photoPath, thumbPath } from '@/lib/photos'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import fs from 'fs/promises'

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
