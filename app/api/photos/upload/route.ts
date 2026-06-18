import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos, tags, photoTags } from '@/lib/schema'
import { eq, and } from 'drizzle-orm'
import Busboy from 'busboy'
import { createWriteStream } from 'fs'
import { stat } from 'fs/promises'
import { Readable } from 'stream'
import path from 'path'
import { photoPath, thumbPath, generateThumb, getImageSize, parseExif, ensureDirs } from '@/lib/photos'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureDirs()

  const contentType = req.headers.get('content-type') ?? ''
  const busboy = Busboy({
    headers: { 'content-type': contentType },
    limits: { fileSize: 300 * 1024 * 1024, files: 20 },
  })

  const uploadedIds: string[] = []
  const filePromises: Promise<void>[] = []
  let batchAlbum: string | null = null
  let batchTitle: string | null = null

  return new Promise<NextResponse>((resolve) => {
    busboy.on('field', (name: string, val: string) => {
      if (name === 'album' && val.trim()) batchAlbum = val.trim().toLowerCase()
      if (name === 'title' && val.trim()) batchTitle = val.trim()
    })

    busboy.on('file', (_field, file, { filename, mimeType }) => {
      const id = crypto.randomUUID()
      const ext = path.extname(filename) || '.jpg'
      const storedName = id + ext
      const filePath = photoPath(storedName)
      const ws = createWriteStream(filePath)
      file.pipe(ws)

      filePromises.push(new Promise<void>((done) => {
        ws.on('close', async () => {
          try {
            const [dims, exif, { size }] = await Promise.all([
              getImageSize(filePath),
              parseExif(filePath),
              stat(filePath),
            ])

            await generateThumb(filePath, thumbPath(storedName))

            const rawDate = exif.DateTimeOriginal ?? exif.CreateDate
            const takenAt = rawDate instanceof Date
              ? rawDate.getTime()
              : rawDate ? new Date(rawDate as string).getTime() : Date.now()

            db.insert(photos).values({
              id,
              userId: session.user!.id!,
              filename: storedName,
              originalName: filename,
              size,
              mimeType,
              width: dims.width,
              height: dims.height,
              exifData: JSON.stringify(exif),
              title: batchTitle ?? path.parse(filename).name.replace(/[-_]/g, ' ').trim(),
              album: batchAlbum,
              takenAt,
              createdAt: Date.now(),
            }).run()

            if (batchAlbum) {
              let tag = db.select({ id: tags.id }).from(tags)
                .where(eq(tags.name, batchAlbum))
                .get()
              if (!tag) {
                const tagId = crypto.randomUUID()
                db.insert(tags).values({ id: tagId, name: batchAlbum }).run()
                tag = { id: tagId }
              }
              db.insert(photoTags).values({ photoId: id, tagId: tag.id }).onConflictDoNothing().run()
            }

            uploadedIds.push(id)
          } catch (err) {
            console.error('Error processing photo:', filename, err)
          }
          done()
        })
      }))
    })

    busboy.on('finish', async () => {
      await Promise.all(filePromises)
      resolve(NextResponse.json({ ids: uploadedIds, count: uploadedIds.length }))
    })

    busboy.on('error', (err) => {
      console.error('Busboy error:', err)
      resolve(NextResponse.json({ error: 'Upload fallido' }, { status: 500 }))
    })

    Readable.fromWeb(req.body as import('stream/web').ReadableStream).pipe(busboy)
  })
}
