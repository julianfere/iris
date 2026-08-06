'use client'

import { useEffect, useRef } from 'react'
import Sheet from '@/components/Sheet'

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

  useEffect(() => { confirmRef.current?.focus() }, [])

  return (
    <Sheet
      title={title}
      onClose={onCancel}
      busy={busy}
      footer={
        <>
          <button className="sheet-btn sheet-btn--ghost" onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
          <button
            ref={confirmRef}
            className={`sheet-btn ${danger ? 'sheet-btn--danger' : 'sheet-btn--primary'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Un momento…' : confirmLabel}
          </button>
        </>
      }
    >
      {detail && (
        <p style={{ margin: '0 0 6px', fontSize: 14, color: 'var(--dim)', lineHeight: 1.5 }}>
          {detail}
        </p>
      )}
    </Sheet>
  )
}
