import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { photos } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { createReadStream, existsSync } from 'fs'
import { Readable } from 'stream'
import { photoPath, thumbPath, generateThumb } from '@/lib/photos'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const photo = db.select().from(photos).where(eq(photos.shareToken, token)).get()
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
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
