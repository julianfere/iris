import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { existsSync, statSync } from 'fs'
import { photoPath } from '@/lib/photos'
import { attachmentHeader, streamFile } from '@/lib/photoServe'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params
  const photo = db.select().from(photos).where(eq(photos.id, id)).get()
  if (!photo) return new NextResponse('Not found', { status: 404 })

  const isOwner = photo.userId === session.user.id
  if (!isOwner && photo.downloadable === 0) return new NextResponse('Forbidden', { status: 403 })

  const filePath = photoPath(photo.filename)
  if (!existsSync(filePath)) return new NextResponse('File not found', { status: 404 })

  // El largo se lee del archivo y no de la columna: si los dos discrepan el
  // navegador corta la descarga a mitad de camino.
  const { size } = statSync(filePath)

  return streamFile(filePath, {
    'Content-Type': photo.mimeType,
    'Content-Length': String(size),
    'Content-Disposition': attachmentHeader(photo.originalName, photo.mimeType),
    'Cache-Control': 'private, max-age=31536000, immutable',
  })
}
