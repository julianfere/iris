import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos, users } from '@/lib/schema'
import { eq, desc, sql } from 'drizzle-orm'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = db
    .select({
      photo: photos,
      user: { id: users.id, name: users.name, avatarColor: users.avatarColor },
      favCount: sql<number>`(SELECT COUNT(*) FROM favorites WHERE photo_id = ${photos.id})`,
      isFav:    sql<number>`(SELECT COUNT(*) FROM favorites WHERE photo_id = ${photos.id} AND user_id = ${session.user.id})`,
    })
    .from(photos)
    .leftJoin(users, eq(photos.userId, users.id))
    .orderBy(desc(photos.takenAt))
    .all()

  const result = rows.map(({ photo, user, favCount, isFav }) => ({
    ...photo,
    exifData: photo.exifData ? JSON.parse(photo.exifData) : {},
    user,
    favCount,
    isFav: isFav > 0,
  }))

  return NextResponse.json(result)
}
