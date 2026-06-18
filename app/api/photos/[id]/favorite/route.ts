import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { favorites, photos } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const photo = db.select().from(photos).where(eq(photos.id, id)).get()
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const existing = db.select().from(favorites).where(and(eq(favorites.userId, session.user.id), eq(favorites.photoId, id))).get()

  if (existing) {
    db.delete(favorites)
      .where(and(eq(favorites.userId, session.user.id), eq(favorites.photoId, id)))
      .run()
    return NextResponse.json({ isFav: false })
  }

  db.insert(favorites).values({ userId: session.user.id, photoId: id, createdAt: Date.now() }).run()
  return NextResponse.json({ isFav: true })
}
