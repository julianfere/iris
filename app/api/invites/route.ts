import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createInvite, listInvites } from '@/lib/invites'

export const runtime = 'nodejs'

// La validacion de un codigo suelto no vive aca: /join/[code] es un server
// component y llama a checkInvite() directo, sin exponer un endpoint publico
// que se pueda usar para tantear codigos.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ invites: listInvites(session.user.id) })
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const open = listInvites(session.user.id).filter(i => !i.usedBy && i.expiresAt >= Date.now())
  if (open.length >= 10) {
    return NextResponse.json(
      { error: 'Ya tenes 10 invitaciones sin usar. Esperá a que las usen o a que venzan.' },
      { status: 429 },
    )
  }

  return NextResponse.json(createInvite(session.user.id), { status: 201 })
}
