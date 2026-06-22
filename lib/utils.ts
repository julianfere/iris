export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'CRT-'
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

const AVATAR_COLORS = [
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

export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
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

export function relativeDate(ts: number): string {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'

  return d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
}
