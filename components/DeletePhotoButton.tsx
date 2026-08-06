'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ConfirmSheet from '@/components/ConfirmSheet'

export default function DeletePhotoButton({ photoId }: { photoId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setBusy(true); setError('')
    try {
      const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      router.push('/global')
    } catch {
      setError('No se pudo eliminar la foto.')
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        disabled={busy}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: '1px solid var(--line)',
          borderRadius: 8,
          color: busy ? 'var(--dim)' : '#f87171',
          cursor: busy ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font)',
          fontSize: 13,
          padding: '13px 14px',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3.5h10M5.5 3.5V2.5h3v1M5 3.5l.5 8M9 3.5l-.5 8"/>
        </svg>
        {busy ? 'Eliminando…' : 'Eliminar'}
      </button>

      {error && <span role="alert" style={{ fontSize: 12, color: '#f87171' }}>{error}</span>}

      {confirming && (
        <ConfirmSheet
          title="¿Eliminar esta foto?"
          detail="Se borran el original, el derivado y la miniatura. No se puede deshacer."
          confirmLabel="Eliminar"
          danger
          busy={busy}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  )
}
