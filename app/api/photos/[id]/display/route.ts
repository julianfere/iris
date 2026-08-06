import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { ensureDisplay, streamFile } from '@/lib/photoServe'

export const runtime = 'nodejs'

/**
 * Lo que ve el visor: WebP de 2560px. Existe porque el visor servia la
 * miniatura de 1400px, o sea que nadie llegaba a ver nunca la foto en calidad
 * sin descargarla; y mandar el original de 40 MB por foto tampoco es opcion.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params
  const photo = db.select().from(photos).where(eq(photos.id, id)).get()
  if (!photo) return new NextResponse('Not found', { status: 404 })

  const filePath = await ensureDisplay(photo)
  if (!filePath) return new NextResponse('File not found', { status: 404 })

  return streamFile(filePath, {
    'Content-Type': 'image/webp',
    'Cache-Control': 'private, max-age=31536000, immutable',
  })
}
