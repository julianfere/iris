'use client'

import { useState } from 'react'
import UploadSheet from '@/components/UploadSheet'

export default function FeedFAB({ existingTags }: { existingTags: string[] }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Subir fotos"
        style={{
          position: 'fixed',
          right: 20,
          bottom: 'calc(72px + env(safe-area-inset-bottom))',
          zIndex: 800,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--ac)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(59,130,246,.4)',
          transition: 'transform .15s, box-shadow .15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={e => (e.currentTarget.style.transform = '')}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {open && (
        <UploadSheet
          existingTags={existingTags}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}
