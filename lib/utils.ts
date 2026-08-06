export const AVATAR_COLORS = [
  'hsl(12,32%,34%)',
  'hsl(210,30%,34%)',
  'hsl(280,26%,36%)',
  'hsl(150,26%,32%)',
  'hsl(330,28%,38%)',
  'hsl(45,30%,36%)',
]

export function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
}

/**
 * El color termina inyectado en un `style` inline que se renderiza para todos
 * los miembros, asi que solo se acepta de la paleta: un valor libre permitiria
 * meter `url(...)` y usar el perfil como beacon.
 */
export function isValidAvatarColor(value: unknown): value is string {
  return typeof value === 'string' && (AVATAR_COLORS as readonly string[]).includes(value)
}

/** UUID v4 tal como lo genera crypto.randomUUID(). */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)          // sin esto, un doble espacio metia "undefined"
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function formatExposure(val: number): string {
  if (val >= 1) return `${val}s`
  return `1/${Math.round(1 / val)}s`
}

const BRAND_DISPLAY: Record<string, string> = {
  nikon: 'Nikon', canon: 'Canon', sony: 'Sony', apple: 'Apple',
  fujifilm: 'Fujifilm', olympus: 'Olympus', panasonic: 'Panasonic',
  leica: 'Leica', hasselblad: 'Hasselblad', ricoh: 'Ricoh',
  pentax: 'Pentax', samsung: 'Samsung', google: 'Google',
  huawei: 'Huawei', xiaomi: 'Xiaomi', dji: 'DJI', gopro: 'GoPro',
  sigma: 'Sigma', phase: 'Phase One', mamiya: 'Mamiya',
}

export function normalizeCameraName(make?: string | null, model?: string | null): string {
  const rawMake = (make ?? '').trim()
  const rawModel = (model ?? '').trim()
  if (!rawMake && !rawModel) return '—'

  // Strip corporate suffixes: "NIKON CORPORATION" → "NIKON"
  const brandStripped = rawMake
    .replace(/\s+(corporation|corp\.?|imaging|electronics?|co\.?,?\s*ltd\.?|inc\.?|gmbh|s\.a\.?|optical)\b.*/i, '')
    .trim()

  const brandKey = brandStripped.toLowerCase()
  const brand = BRAND_DISPLAY[brandKey]
    ?? (brandStripped.charAt(0).toUpperCase() + brandStripped.slice(1).toLowerCase())

  if (!rawModel) return brand || '—'

  // Remove brand prefix from model if redundant: "NIKON D750" → "D750" when brand is "Nikon"
  const escaped = brandStripped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const modelClean = rawModel.replace(new RegExp(`^${escaped}\\s+`, 'i'), '').trim()

  if (!brand) return modelClean || '—'
  return `${brand} ${modelClean}`
}

/**
 * Coordenadas de una foto, o null si no tiene.
 *
 * exifr devuelve `GPSLatitude` como el array crudo [grados, minutos, segundos]
 * y ADEMAS `latitude`/`longitude` ya resueltos a decimal con el hemisferio
 * aplicado. El visor chequeaba `typeof exif.GPSLatitude === 'number'`, que
 * sobre un array nunca es cierto: la ubicacion no se mostro nunca, en ninguna
 * foto. Usar el array a mano tampoco alcanzaba, porque no lleva el signo — sin
 * GPSLatitudeRef, Buenos Aires cae en el hemisferio norte.
 */
export function photoCoords(exif: Record<string, unknown>): { lat: number; lon: number } | null {
  const lat = exif.latitude
  const lon = exif.longitude
  if (typeof lat !== 'number' || typeof lon !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  // 0,0 es el Golfo de Guinea: en la practica siempre es un EXIF vacio.
  if (lat === 0 && lon === 0) return null
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  return { lat, lon }
}

export function relativeDate(ts: number): string {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'

  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
}
