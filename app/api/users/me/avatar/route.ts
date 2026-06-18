import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { writeFile } from 'fs/promises'
import { avatarPath, ensureAvatarsDir } from '@/lib/photos'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('avatar') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Solo imágenes' }, { status: 400 })

  await ensureAvatarsDir()

  const buffer = Buffer.from(await file.arrayBuffer())
  const { default: sharp } = await import('sharp')

  const webp = await sharp(buffer)
    .resize(400, 400, { fit: 'cover', position: 'center' })
    .webp({ quality: 85 })
    .toBuffer()

  await writeFile(avatarPath(session.user.id), webp)

  return NextResponse.json({ ok: true })
}
