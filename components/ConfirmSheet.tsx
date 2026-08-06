'use client'

import { useEffect, useRef } from 'react'

type Props = {
  title: string
  detail?: string
  confirmLabel: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * Reemplaza a confirm(). En la PWA instalada el dialogo nativo aparece con el
 * dominio arriba y rompe la ilusion de app; ademas no se puede explicar nada
 * ni mostrar el estado mientras la accion corre.
 */
export default function ConfirmSheet({
  title, detail, confirmLabel, danger, busy, onConfirm, onCancel,
}: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    confirmRef.current?.focus()
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !busy) onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, onCancel])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 1200,
        background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        animation: 'cr-fade .15s ease both',
      }}
      onClick={e => { if (e.target === e.currentTarget && !busy) onCancel() }}
    >
      <div style={{
        width: '100%', maxWidth: 460, background: 'var(--bg)',
        borderRadius: '18px 18px 0 0', borderTop: '1px solid var(--line)',
        padding: '22px 20px calc(22px + env(safe-area-inset-bottom))',
        animation: 'sheet-up .22s cubic-bezier(.32,1,.28,1) both',
      }}>
        <h2 id="confirm-title" style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 600 }}>{title}</h2>
        {detail && <p style={{ margin: '0 0 20px', fontSize: 13.5, color: 'var(--dim)', lineHeight: 1.5 }}>{detail}</p>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              flex: 1, padding: '13px 16px', borderRadius: 10,
              background: 'var(--s1)', border: '1px solid var(--line)',
              color: 'var(--txt)', fontFamily: 'var(--font)', fontSize: 14,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={busy}
            style={{
              flex: 1, padding: '13px 16px', borderRadius: 10, border: 'none',
              background: danger ? '#b91c1c' : 'var(--ac)',
              color: '#fff', fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500,
              cursor: busy ? 'wait' : 'pointer', opacity: busy ? .7 : 1,
            }}
          >
            {busy ? 'Un momento…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
