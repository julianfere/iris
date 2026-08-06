import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { isValidAvatarColor } from '@/lib/utils'

export const runtime = 'nodejs'

const NAME_MAX = 60
const BIO_MAX = 280

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updates: Partial<typeof users.$inferInsert> = {}

  if (body.name !== undefined) {
    const name = String(body.name).trim()
    if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    if (name.length > NAME_MAX) return NextResponse.json({ error: `El nombre no puede superar ${NAME_MAX} caracteres` }, { status: 400 })
    updates.name = name
  }
  if (body.bio !== undefined) {
    const bio = String(body.bio ?? '').trim()
    if (bio.length > BIO_MAX) return NextResponse.json({ error: `La bio no puede superar ${BIO_MAX} caracteres` }, { status: 400 })
    updates.bio = bio || null
  }
  if (body.avatarColor !== undefined) {
    if (!isValidAvatarColor(body.avatarColor)) {
      return NextResponse.json({ error: 'Color invalido' }, { status: 400 })
    }
    updates.avatarColor = body.avatarColor
  }

  if (Object.keys(updates).length > 0) {
    db.update(users).set(updates).where(eq(users.id, session.user.id)).run()
  }

  return NextResponse.json({ ok: true })
}
