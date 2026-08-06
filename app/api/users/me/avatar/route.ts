import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import { avatarPath, ensureAvatarsDir } from '@/lib/photos'

export const runtime = 'nodejs'

const AVATAR_MAX_BYTES = 8 * 1024 * 1024

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('avatar') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Solo imágenes' }, { status: 400 })
  // El tamaño se chequea ANTES del arrayBuffer(): sin esto, el archivo entero
  // entra en memoria y un POST grande alcanza para voltear el contenedor.
  if (file.size > AVATAR_MAX_BYTES) {
    return NextResponse.json({ error: 'El avatar no puede pesar más de 8 MB' }, { status: 413 })
  }

  await ensureAvatarsDir()

  const buffer = Buffer.from(await file.arrayBuffer())
  const { default: sharp } = await import('sharp')

  try {
    const webp = await sharp(buffer)
      .resize(400, 400, { fit: 'cover', position: 'center' })
      .webp({ quality: 85 })
      .toBuffer()
    await writeFile(avatarPath(session.user.id), webp)
  } catch {
    return NextResponse.json({ error: 'No pudimos procesar esa imagen' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
