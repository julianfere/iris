import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { randomAvatarColor } from '@/lib/utils'
import { checkInvite, isBootstrap, redeemInvite } from '@/lib/invites'

export const runtime = 'nodejs'

const NAME_MAX = 60
const EMAIL_MAX = 254

const INVITE_ERROR: Record<string, string> = {
  unknown: 'Ese codigo de invitacion no existe',
  used:    'Ese codigo de invitacion ya fue usado',
  expired: 'Ese codigo de invitacion vencio',
}

export async function POST(req: NextRequest) {
  const { name, email, password, inviteCode } = await req.json()

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }
  if (String(name).trim().length > NAME_MAX) {
    return NextResponse.json({ error: `El nombre no puede superar ${NAME_MAX} caracteres` }, { status: 400 })
  }
  if (String(email).trim().length > EMAIL_MAX) {
    return NextResponse.json({ error: 'Email invalido' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'La contrasena debe tener al menos 8 caracteres' }, { status: 400 })
  }

  // El primer usuario del carrete entra sin codigo: no hay a quien pedirselo.
  const bootstrap = isBootstrap()
  if (!bootstrap) {
    if (!inviteCode?.trim()) {
      return NextResponse.json({ error: 'Necesitas un codigo de invitacion' }, { status: 403 })
    }
    const check = checkInvite(inviteCode)
    if (!check.ok) {
      return NextResponse.json({ error: INVITE_ERROR[check.reason] }, { status: 403 })
    }
  }

  const normalEmail = String(email).toLowerCase().trim()
  const existing = db.select({ id: users.id }).from(users).where(eq(users.email, normalEmail)).get()
  if (existing) {
    return NextResponse.json({ error: 'Email ya registrado' }, { status: 409 })
  }

  const id = crypto.randomUUID()
  const passwordHash = await bcrypt.hash(password, 12)

  // Se quema el codigo ANTES de crear la cuenta: si dos altas corren a la vez
  // con el mismo codigo, solo la que gana el UPDATE condicional sigue.
  if (!bootstrap && !redeemInvite(inviteCode, id)) {
    return NextResponse.json({ error: 'Ese codigo de invitacion ya fue usado' }, { status: 403 })
  }

  db.insert(users).values({
    id,
    name: String(name).trim(),
    email: normalEmail,
    passwordHash,
    avatarColor: randomAvatarColor(),
    createdAt: Date.now(),
  }).run()

  return NextResponse.json({ id }, { status: 201 })
}
