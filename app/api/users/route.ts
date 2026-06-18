import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { randomAvatarColor } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
  }

  const normalEmail = email.toLowerCase().trim()
  const existing = db.select({ id: users.id }).from(users).where(eq(users.email, normalEmail)).get()
  if (existing) {
    return NextResponse.json({ error: 'Email ya registrado' }, { status: 409 })
  }

  const id = crypto.randomUUID()
  const passwordHash = await bcrypt.hash(password, 12)

  db.insert(users).values({
    id,
    name: name.trim(),
    email: normalEmail,
    passwordHash,
    avatarColor: randomAvatarColor(),
    createdAt: Date.now(),
  }).run()

  return NextResponse.json({ id }, { status: 201 })
}
