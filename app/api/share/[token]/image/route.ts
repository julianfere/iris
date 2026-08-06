import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { photos } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { ensureThumb, streamFile } from '@/lib/photoServe'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const photo = db.select().from(photos).where(eq(photos.shareToken, token)).get()
  if (!photo) return new NextResponse('Not found', { status: 404 })

  // Miniatura y no display: el link publico se manda por fuera del carrete,
  // asi que muestra lo justo para reconocer la foto, no la version buena.
  const filePath = await ensureThumb(photo)
  if (!filePath) return new NextResponse('File not found', { status: 404 })

  return streamFile(filePath, {
    'Content-Type': 'image/webp',
    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
  })
}
