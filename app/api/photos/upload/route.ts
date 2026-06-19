import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos, tags, photoTags } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import Busboy from 'busboy'
import { createWriteStream } from 'fs'
import { unlink, stat } from 'fs/promises'
import { Readable } from 'stream'
import path from 'path'
import { photoPath, thumbPath, generateThumb, compressToWebP, parseExif, ensureDirs } from '@/lib/photos'

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
  let batchTags: string[] = []
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
      const ext = path.extname(filename) || '.jpg'
      const tempName = id + ext
      const tempPath = photoPath(tempName)
      const ws = createWriteStream(tempPath)
      file.pipe(ws)

      filePromises.push(new Promise<void>((done) => {
        ws.on('close', async () => {
          try {
            const [exif, { size: originalSize }] = await Promise.all([
              parseExif(tempPath),
              stat(tempPath),
            ])

            const storedName = id + '.webp'
            const filePath = photoPath(storedName)
            const { width, height, size } = await compressToWebP(tempPath, filePath)
            await unlink(tempPath)

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
              originalSize,
              mimeType: 'image/webp',
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
