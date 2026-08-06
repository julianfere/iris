export const PAGE_SIZE = 48
const MAX_PAGE = PAGE_SIZE * 20

/**
 * Cuantas fotos pedir en esta vista.
 *
 * Todas las grillas hacian `.all()` sin LIMIT y renderizaban el HTML completo
 * en cada request (force-dynamic, sin cache). Con 8 fotos no se nota; con
 * 2.000 el TTFB se va a segundos y el HTML a varios MB. Era el techo de
 * escala del proyecto.
 *
 * El tamano viaja en la URL y crece de a PAGE_SIZE, asi que "Cargar más" es
 * un enlace: funciona sin JS y la vista queda compartible tal cual se ve.
 */
export function parsePageSize(raw: string | string[] | undefined): number {
  const n = Number(Array.isArray(raw) ? raw[0] : raw)
  if (!Number.isFinite(n)) return PAGE_SIZE
  return Math.min(MAX_PAGE, Math.max(PAGE_SIZE, Math.ceil(n / PAGE_SIZE) * PAGE_SIZE))
}

/**
 * Se pide una fila de mas que el limite para saber si hay siguiente pagina sin
 * pagar un COUNT(*) aparte.
 */
export function slicePage<T>(rows: T[], size: number): { items: T[]; hasMore: boolean } {
  return { items: rows.slice(0, size), hasMore: rows.length > size }
}

/** URL de la misma vista con una pagina mas, preservando el resto del query. */
export function nextPageHref(
  basePath: string,
  current: Record<string, string | string[] | undefined>,
  size: number,
): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(current)) {
    if (k === 'n' || v === undefined) continue
    for (const one of Array.isArray(v) ? v : [v]) p.append(k, one)
  }
  p.set('n', String(size + PAGE_SIZE))
  return `${basePath}?${p.toString()}`
}
