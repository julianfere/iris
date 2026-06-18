import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { createReadStream, existsSync } from 'fs'
import { Readable } from 'stream'
import { photoPath, thumbPath, generateThumb } from '@/lib/photos'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params
  const photo = db.select().from(photos).where(eq(photos.id, id)).get()
  if (!photo) return new NextResponse('Not found', { status: 404 })

  const tPath = thumbPath(photo.filename)
  if (!existsSync(tPath)) {
    const orig = photoPath(photo.filename)
    if (!existsSync(orig)) return new NextResponse('File not found', { status: 404 })
    await generateThumb(orig, tPath)
  }

  const webStream = Readable.toWeb(createReadStream(tPath)) as ReadableStream

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  })
}
