import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const photo = db.select().from(photos).where(eq(photos.id, id)).get()
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (photo.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const token = photo.shareToken ?? randomBytes(16).toString('base64url')
  if (!photo.shareToken) {
    db.update(photos).set({ shareToken: token }).where(eq(photos.id, id)).run()
  }

  return NextResponse.json({ token, shareUrl: `/s/${token}` })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const photo = db.select().from(photos).where(eq(photos.id, id)).get()
  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (photo.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  db.update(photos).set({ shareToken: null }).where(eq(photos.id, id)).run()
  return NextResponse.json({ ok: true })
}
