import path from 'path'
import fs from 'fs/promises'

export const PHOTOS_DIR = process.env.PHOTOS_DIR
  ? process.env.PHOTOS_DIR
  : path.join(process.cwd(), 'photos')

export const THUMBS_DIR = path.join(PHOTOS_DIR, '.thumbs')

export const AVATARS_DIR = path.join(PHOTOS_DIR, '.avatars')

export async function ensureAvatarsDir() {
  await fs.mkdir(AVATARS_DIR, { recursive: true })
}

export function avatarPath(userId: string) {
  return path.join(AVATARS_DIR, userId + '.webp')
}

export async function ensureDirs() {
  await fs.mkdir(PHOTOS_DIR, { recursive: true })
  await fs.mkdir(THUMBS_DIR, { recursive: true })
}

export function photoPath(filename: string) {
  return path.join(PHOTOS_DIR, filename)
}

export function thumbPath(filename: string) {
  return path.join(THUMBS_DIR, path.parse(filename).name + '.webp')
}

export async function generateThumb(srcPath: string, destPath: string): Promise<void> {
  const { default: sharp } = await import('sharp')
  await sharp(srcPath)
    .resize(900, 900, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(destPath)
}

export async function getImageSize(filePath: string): Promise<{ width?: number; height?: number }> {
  try {
    const { default: sharp } = await import('sharp')
    const { width, height } = await sharp(filePath).metadata()
    return { width, height }
  } catch {
    return {}
  }
}

export async function parseExif(filePath: string): Promise<Record<string, unknown>> {
  try {
    const { default: exifr } = await import('exifr')
    // Pass buffer instead of filepath so exifr doesn't need to use its own fs binding
    const buffer = await fs.readFile(filePath)
    const exif = await exifr.parse(buffer, { translateValues: true, translateKeys: true })
    console.log('[exif]', path.basename(filePath), JSON.stringify(exif)?.slice(0, 300))
    return exif ?? {}
  } catch (err) {
    console.error('[exif] parse error:', path.basename(filePath), err)
    return {}
  }
}
