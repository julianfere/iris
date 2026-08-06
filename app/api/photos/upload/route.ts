import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos, tags, photoTags } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import Busboy from 'busboy'
import { createWriteStream } from 'fs'
import { stat } from 'fs/promises'
import { Readable } from 'stream'
import path from 'path'
import {
  photoPath, thumbPath, displayName, generateThumb, generateDisplay, getImageSize,
  parseExif, hashFile, ensureDirs, safeUnlink,
} from '@/lib/photos'
import { sendPushToAll } from '@/lib/push'

export const runtime = 'nodejs'
export const maxDuration = 300

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.heic': 'image/heic', '.heif': 'image/heif',
  '.tif': 'image/tiff', '.tiff': 'image/tiff', '.avif': 'image/avif',
  '.gif': 'image/gif', '.dng': 'image/x-adobe-dng',
}

type FileResult =
  | { ok: true; id: string }
  | { ok: false; name: string; reason: string }

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userId = session.user.id

  await ensureDirs()

  const contentType = req.headers.get('content-type') ?? ''
  const busboy = Busboy({
    headers: { 'content-type': contentType },
    limits: { fileSize: 300 * 1024 * 1024, files: 20 },
  })

  const results: FileResult[] = []
  const filePromises: Promise<void>[] = []
  const batchTags: string[] = []
  let batchTitle: string | null = null
  let batchDownloadable = 1

  return new Promise<NextResponse>((resolve) => {
    busboy.on('field', (name: string, val: string) => {
      if (name === 'tag' && val.trim()) batchTags.push(val.trim().toLowerCase())
      if (name === 'title' && val.trim()) batchTitle = val.trim()
      if (name === 'downloadable') batchDownloadable = val === '1' ? 1 : 0
    })

    busboy.on('file', (_field, file, { filename }) => {
      const id = crypto.randomUUID()
      const ext = (path.extname(filename) || '.jpg').toLowerCase()
      // El archivo subido se queda tal cual: este ES el original.
      const storedName = id + ext
      const storedPath = photoPath(storedName)
      const ws = createWriteStream(storedPath)
      let truncated = false

      file.on('limit', () => { truncated = true })
      file.pipe(ws)

      filePromises.push(new Promise<void>((done) => {
        ws.on('close', async () => {
          // `keep` decide en el finally si el original se conserva o se
          // borra. Antes el unlink del temporal vivia en el camino feliz,
          // asi que cualquier error dejaba el archivo huerfano para siempre.
          let keep = false
          try {
            if (truncated) {
              results.push({ ok: false, name: filename, reason: 'Supera el limite de 300 MB' })
              return
            }

            const [exif, { size }, contentHash] = await Promise.all([
              parseExif(storedPath),
              stat(storedPath),
              hashFile(storedPath),
            ])

            const dup = db.select({ id: photos.id, originalName: photos.originalName })
              .from(photos).where(eq(photos.contentHash, contentHash)).get()
            if (dup) {
              results.push({ ok: false, name: filename, reason: `Ya estaba subida como "${dup.originalName}"` })
              return
            }

            const display = displayName(id)
            const { size: dSize } = await generateDisplay(storedPath, photoPath(display))
            await generateThumb(photoPath(display), thumbPath(storedName))

            // Las dimensiones son las del ORIGINAL, no las del derivado: la
            // ficha las muestra como el tamaño de la foto, y para cualquier
            // original de mas de 2560px el display miente.
            const { width, height } = await getImageSize(storedPath)

            const rawDate = exif.DateTimeOriginal ?? exif.CreateDate
            const takenAt = rawDate instanceof Date
              ? rawDate.getTime()
              : rawDate ? new Date(rawDate as string).getTime() : Date.now()

            db.insert(photos).values({
              id,
              userId,
              filename: storedName,
              hasOriginal: 1,
              displayName: display,
              displaySize: dSize,
              contentHash,
              originalName: filename,
              size,
              originalSize: size,
              mimeType: MIME_BY_EXT[ext] ?? 'application/octet-stream',
              width,
              height,
              exifData: JSON.stringify(exif),
              title: batchTitle ?? path.parse(filename).name.replace(/[-_]/g, ' ').trim(),
              album: batchTags[0] ?? null,
              downloadable: batchDownloadable,
              takenAt,
              createdAt: Date.now(),
            }).run()

            for (const tagName of batchTags) {
              let tag = db.select({ id: tags.id }).from(tags).where(eq(tags.name, tagName)).get()
              if (!tag) {
                const tagId = crypto.randomUUID()
                db.insert(tags).values({ id: tagId, name: tagName }).run()
                tag = { id: tagId }
              }
              db.insert(photoTags).values({ photoId: id, tagId: tag.id }).onConflictDoNothing().run()
            }

            keep = true
            results.push({ ok: true, id })
          } catch (err) {
            console.error('[upload] fallo procesando', filename, err)
            results.push({ ok: false, name: filename, reason: 'No pudimos procesarla' })
          } finally {
            if (!keep) {
              await safeUnlink(storedPath)
              await safeUnlink(photoPath(displayName(id)))
              await safeUnlink(thumbPath(id + ext))
            }
            done()
          }
        })
      }))
    })

    busboy.on('finish', async () => {
      await Promise.all(filePromises)

      const uploaded = results.filter((r): r is Extract<FileResult, { ok: true }> => r.ok)
      const failed = results.filter((r): r is Extract<FileResult, { ok: false }> => !r.ok)

      if (uploaded.length > 0) {
        const userName = session.user?.name ?? 'Alguien'
        const title = uploaded.length === 1
          ? `Nueva foto de ${userName}`
          : `${uploaded.length} fotos nuevas de ${userName}`
        sendPushToAll({ title, url: '/global' }, userId).catch(() => {})
      }

      // 207 cuando algo fallo: el cliente necesita poder distinguir "todo
      // bien" de "ninguna entro", que antes eran los dos un 200 con tilde.
      resolve(NextResponse.json(
        { ids: uploaded.map(u => u.id), count: uploaded.length, failed },
        { status: failed.length === 0 ? 200 : 207 },
      ))
    })

    busboy.on('error', (err) => {
      console.error('[upload] busboy', err)
      resolve(NextResponse.json({ error: 'Upload fallido' }, { status: 500 }))
    })

    Readable.fromWeb(req.body as import('stream/web').ReadableStream).pipe(busboy)
  })
}
