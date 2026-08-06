import path from 'path'
import fs from 'fs/promises'
import { createHash } from 'crypto'
import { createReadStream } from 'fs'
import nodeFs from 'fs'

/** Lado mayor del derivado que consume el visor. */
export const DISPLAY_MAX_PX = 2560
/** Lado mayor de la miniatura de las grillas. */
export const THUMB_MAX_PX = 1400

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

/**
 * Que usuarios tienen archivo de avatar. Un readdir de un directorio chico es
 * mas barato que un existsSync por miembro, y sobre todo evita que el cliente
 * pida /avatar de gente que no tiene y coleccione 404 en cada render.
 */
export function usersWithAvatar(): Set<string> {
  try {
    return new Set(
      nodeFs.readdirSync(AVATARS_DIR)
        .filter(f => f.endsWith('.webp'))
        .map(f => f.slice(0, -'.webp'.length)),
    )
  } catch {
    return new Set()
  }
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

export function displayName(id: string) {
  return `${id}.display.webp`
}

/**
 * Escribe via temporal + rename. `rename` es atomico dentro del mismo
 * filesystem, asi que dos requests que generen el mismo derivado a la vez no
 * pueden dejar un archivo a medio escribir servido con cache immutable.
 */
async function writeAtomic(destPath: string, write: (tmp: string) => Promise<void>): Promise<void> {
  const tmp = `${destPath}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`
  try {
    await write(tmp)
    await fs.rename(tmp, destPath)
  } catch (err) {
    await safeUnlink(tmp)
    throw err
  }
}

/** SHA-256 por stream: los originales pesan decenas de MB y no entran comodos en RAM. */
export function hashFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const rs = createReadStream(filePath)
    rs.on('data', chunk => hash.update(chunk))
    rs.on('end', () => resolve(hash.digest('hex')))
    rs.on('error', reject)
  })
}

export type Derivative = { width: number; height: number; size: number }

/**
 * libvips cachea handles de los archivos de entrada, y en Windows eso deja el
 * original bloqueado: si Sharp falla a mitad de la decodificacion, el unlink
 * de limpieza tira EPERM y el archivo queda huerfano igual. Apagar el cache lo
 * libera apenas termina la operacion.
 */
let sharpConfigured = false
async function loadSharp() {
  const { default: sharp } = await import('sharp')
  if (!sharpConfigured) {
    sharp.cache(false)
    sharpConfigured = true
  }
  return sharp
}

/**
 * Borra sin romper si el archivo ya no esta, pero avisa cualquier otro error:
 * tragarlos en silencio es exactamente como se acumularon 72 MB de huerfanos.
 */
export async function safeUnlink(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') return
    console.error('[photos] no se pudo borrar', filePath, (err as NodeJS.ErrnoException)?.code)
  }
}

/**
 * Derivado que ve el visor: grande de verdad, pero acotado para que abrir una
 * foto no baje los 38 MB del original.
 */
export async function generateDisplay(srcPath: string, destPath: string): Promise<Derivative> {
  const sharp = await loadSharp()
  let info!: Derivative
  await writeAtomic(destPath, async tmp => {
    const out = await sharp(srcPath, { failOn: 'none' })
      .rotate()
      .resize(DISPLAY_MAX_PX, DISPLAY_MAX_PX, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 92 })
      .toFile(tmp)
    info = { width: out.width, height: out.height, size: out.size }
  })
  return info
}

export async function generateThumb(srcPath: string, destPath: string): Promise<void> {
  const sharp = await loadSharp()
  await writeAtomic(destPath, async tmp => {
    await sharp(srcPath, { failOn: 'none' })
      .rotate()
      .resize(THUMB_MAX_PX, THUMB_MAX_PX, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 88, effort: 6 })
      .toFile(tmp)
  })
}

export async function getImageSize(filePath: string): Promise<{ width?: number; height?: number }> {
  try {
    const sharp = await loadSharp()
    const { width, height } = await sharp(filePath).metadata()
    return { width, height }
  } catch {
    return {}
  }
}

export async function parseExif(filePath: string): Promise<Record<string, unknown>> {
  try {
    const { default: exifr } = await import('exifr')
    // Se le pasa un Buffer y no la ruta para que exifr no necesite su binding
    // propio de fs, que bajo el bundle del server no resuelve (de ahi los
    // "Couldn't load fs / zlib" que exifr avisa al cargarse; son inocuos).
    const buffer = await fs.readFile(filePath)
    const exif = await exifr.parse(buffer, { translateValues: true, translateKeys: true })
    return exif ?? {}
  } catch (err) {
    console.error('[exif] parse error:', path.basename(filePath), err)
    return {}
  }
}
