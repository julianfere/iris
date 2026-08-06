import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos } from '@/lib/schema'
import { inArray } from 'drizzle-orm'
import { photoPath } from '@/lib/photos'
import { existsSync } from 'fs'
import { Readable, PassThrough } from 'stream'
import { ZipArchive } from 'archiver'

export const runtime = 'nodejs'

const MAX_IDS = 500

/**
 * POST y no GET: los ids iban en el querystring, asi que a partir de ~200
 * fotos seleccionadas la URL superaba el limite del server y la descarga
 * fallaba sin decir por que.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })
  const userId = session.user.id

  let ids: string[]
  try {
    const body = await req.json()
    ids = Array.isArray(body?.ids) ? body.ids.filter((v: unknown) => typeof v === 'string' && v) : []
  } catch {
    return new NextResponse('Bad request', { status: 400 })
  }

  if (ids.length === 0) return new NextResponse('No ids', { status: 400 })
  if (ids.length > MAX_IDS) return new NextResponse(`Maximo ${MAX_IDS} fotos por descarga`, { status: 413 })

  const rows = db.select().from(photos).where(inArray(photos.id, ids)).all()
  const allowed = rows.filter(p => p.userId === userId || p.downloadable !== 0)
  if (allowed.length === 0) return new NextResponse('Nothing to download', { status: 403 })

  const archive = new ZipArchive({ zlib: { level: 6 } })
  const passthrough = new PassThrough()
  archive.on('error', (err: Error) => passthrough.destroy(err))
  archive.pipe(passthrough)

  const usedNames = new Set<string>()
  let added = 0
  for (const photo of allowed) {
    const filePath = photoPath(photo.filename)
    if (!existsSync(filePath)) continue
    let name = photo.originalName || `${photo.id}.jpg`
    if (usedNames.has(name)) {
      const dot = name.lastIndexOf('.')
      const base = dot > 0 ? name.slice(0, dot) : name
      const ext = dot > 0 ? name.slice(dot) : ''
      name = `${base}-${photo.id.slice(0, 8)}${ext}`
    }
    usedNames.add(name)
    archive.file(filePath, { name })
    added++
  }
  archive.finalize()

  const webStream = Readable.toWeb(passthrough) as ReadableStream

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="carrete-${added}-fotos.zip"`,
    },
  })
}
