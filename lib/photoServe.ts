import { createReadStream, existsSync } from 'fs'
import { Readable } from 'stream'
import { NextResponse } from 'next/server'
import { db } from './db'
import { photos } from './schema'
import { eq } from 'drizzle-orm'
import { displayName, generateDisplay, generateThumb, photoPath, thumbPath } from './photos'

type Photo = typeof photos.$inferSelect

export function streamFile(filePath: string, headers: Record<string, string>) {
  const webStream = Readable.toWeb(createReadStream(filePath)) as ReadableStream
  return new NextResponse(webStream, { headers })
}

/**
 * Ruta del derivado de 2560px, generandolo si falta. Las filas anteriores al
 * pipeline de originales no tienen display_name; se les crea a partir del
 * mejor archivo que quedo y se persiste para no repetir el trabajo.
 */
export async function ensureDisplay(photo: Photo): Promise<string | null> {
  const source = photoPath(photo.filename)
  if (!existsSync(source)) return null

  const name = photo.displayName ?? displayName(photo.id)
  const dest = photoPath(name)

  if (!existsSync(dest)) {
    const { size } = await generateDisplay(source, dest)
    db.update(photos).set({ displayName: name, displaySize: size }).where(eq(photos.id, photo.id)).run()
  } else if (!photo.displayName) {
    db.update(photos).set({ displayName: name }).where(eq(photos.id, photo.id)).run()
  }

  return dest
}

export async function ensureThumb(photo: Photo): Promise<string | null> {
  const dest = thumbPath(photo.filename)
  if (existsSync(dest)) return dest

  // Se prefiere el display como fuente: redimensionar 2560 -> 1400 es mucho
  // mas barato que volver a decodificar un original de 40 MB.
  const display = photo.displayName ? photoPath(photo.displayName) : null
  const source = display && existsSync(display) ? display : photoPath(photo.filename)
  if (!existsSync(source)) return null

  await generateThumb(source, dest)
  return dest
}

/**
 * Content-Disposition con el nombre real y la extension que corresponde al
 * archivo que efectivamente se manda. Antes se anunciaba "foto.jpg" y viajaba
 * un WebP, asi que el archivo bajaba con una extension que no era la suya.
 */
export function attachmentHeader(originalName: string, mimeType: string): string {
  const EXT_BY_MIME: Record<string, string> = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp',
    'image/heic': '.heic', 'image/heif': '.heif', 'image/tiff': '.tif',
    'image/avif': '.avif', 'image/gif': '.gif', 'image/x-adobe-dng': '.dng',
  }
  const wanted = EXT_BY_MIME[mimeType]
  const base = originalName.replace(/\.[^./\\]+$/, '') || 'foto'
  const name = wanted ? base + wanted : originalName

  // ASCII para clientes viejos, RFC 5987 para el nombre real con acentos.
  const ascii = name.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_')
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`
}
