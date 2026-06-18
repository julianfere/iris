'use client'

import { useEffect } from 'react'
import UploadZone from '@/components/UploadZone'

type Props = {
  existingTags: string[]
  onClose: () => void
}

export default function UploadSheet({ existingTags, onClose }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,.6)',
        backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'cr-fade .15s ease both',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          width: '100%',
          maxHeight: '92dvh',
          background: 'var(--bg)',
          borderRadius: '18px 18px 0 0',
          borderTop: '1px solid var(--line)',
          overflowY: 'auto',
          animation: 'sheet-up .22s cubic-bezier(.32,1,.28,1) both',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px 0' }}>
          <span style={{ flex: 1, fontWeight: 600, fontSize: 16 }}>Subir fotos</span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--dim)', padding: 6, borderRadius: 6,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2 2l12 12M14 2L2 14" />
            </svg>
          </button>
        </div>

        <UploadZone
          existingTags={existingTags}
          onSuccess={onClose}
          compact
        />
      </div>
    </div>
  )
}
