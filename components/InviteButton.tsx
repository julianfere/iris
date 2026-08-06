'use client'

import { useState } from 'react'
import InviteSheet from '@/components/InviteSheet'

export default function InviteButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'none', border: '1px solid var(--line)', borderRadius: 8,
          color: 'var(--dim)', cursor: 'pointer', fontFamily: 'var(--font)',
          fontSize: 13, padding: '8px 14px',
          display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6M22 11h-6" />
        </svg>
        Invitar
      </button>

      {open && <InviteSheet onClose={() => setOpen(false)} />}
    </>
  )
}
