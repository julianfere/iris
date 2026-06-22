import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { pushSubscriptions } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint, keys } = await req.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  db.insert(pushSubscriptions).values({
    id:        randomUUID(),
    userId:    session.user.id,
    endpoint,
    p256dh:    keys.p256dh,
    auth:      keys.auth,
    createdAt: Date.now(),
  }).onConflictDoNothing().run()

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { endpoint } = await req.json()
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })

  db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint)).run()

  return NextResponse.json({ ok: true })
}
