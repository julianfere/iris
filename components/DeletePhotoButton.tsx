'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeletePhotoButton({ photoId }: { photoId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function handleDelete() {
    if (!confirm('¿Eliminar esta foto? No se puede deshacer.')) return
    setBusy(true)
    const res = await fetch(`/api/photos/${photoId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/global')
    } else {
      alert('No se pudo eliminar la foto.')
      setBusy(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      title="Eliminar foto"
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
  )
}
