'use client'

import { useEffect, useRef } from 'react'

type Props = {
  title: string
  onClose: () => void
  /** Bloquea el cierre mientras hay una operacion en curso. */
  busy?: boolean
  /** Oculta el encabezado cuando el contenido ya lo trae. */
  hideHeader?: boolean
  children: React.ReactNode
  footer?: React.ReactNode
}

/**
 * Hoja inferior, mobile-first. Unica implementacion: habia cuatro copias del
 * mismo patron y cada una fallaba distinto en el telefono.
 *
 * Lo que resuelve y antes no:
 * - `100dvh` en vez de `vh`, y altura maxima real, para que el contenido pueda
 *   scrollear en lugar de desbordar.
 * - El teclado de iOS no achica el layout viewport, solo el visual: sin
 *   escuchar `visualViewport` la hoja queda tapada por el teclado. Se compensa
 *   con padding en vivo.
 * - `overscroll-behavior: contain` para que el scroll no se propague al fondo.
 * - Encabezado y pie fijos, con el medio scrolleable: en pantallas bajas los
 *   botones de accion quedaban abajo de todo, fuera de alcance.
 * - Safe area inferior, para el gesto de home del iPhone.
 */
export default function Sheet({ title, onClose, busy, hideHeader, children, footer }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !busy) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  // El teclado virtual solo encoge el visual viewport. Sin esto la hoja no se
  // entera y los campos de abajo quedan atras del teclado.
  useEffect(() => {
    const vv = window.visualViewport
    const panel = panelRef.current
    if (!vv || !panel) return
    const sync = () => {
      const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      panel.style.setProperty('--kb', `${overlap}px`)
    }
    sync()
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    return () => { vv.removeEventListener('resize', sync); vv.removeEventListener('scroll', sync) }
  }, [])

  return (
    <div
      className="sheet-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={e => { if (e.target === e.currentTarget && !busy) onClose() }}
    >
      <div className="sheet-panel" ref={panelRef}>
        <div className="sheet-grab" aria-hidden="true"><span /></div>

        {!hideHeader && (
          <div className="sheet-head">
            <h2 className="sheet-title">{title}</h2>
            <button onClick={onClose} disabled={busy} aria-label="Cerrar" className="sheet-close">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 2l12 12M14 2L2 14" />
              </svg>
            </button>
          </div>
        )}

        <div className="sheet-body">{children}</div>

        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  )
}
