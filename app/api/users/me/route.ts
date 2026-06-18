import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updates: Partial<typeof users.$inferInsert> = {}

  if (body.name !== undefined) {
    if (!String(body.name).trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
    updates.name = String(body.name).trim()
  }
  if (body.bio !== undefined) updates.bio = body.bio?.trim() || null
  if (body.avatarColor !== undefined) updates.avatarColor = body.avatarColor

  if (Object.keys(updates).length > 0) {
    db.update(users).set(updates).where(eq(users.id, session.user.id)).run()
  }

  return NextResponse.json({ ok: true })
}
