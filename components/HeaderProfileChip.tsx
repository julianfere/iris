'use client'

import { initials } from '@/lib/utils'

type Props = {
  userId: string
  name: string
  avatarColor: string
}

export default function HeaderProfileChip({ userId, name, avatarColor }: Props) {
  return (
    <a
      href="/profile"
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        textDecoration: 'none',
        padding: '4px 11px 4px 4px',
        borderRadius: 999,
        border: '1px solid var(--line)',
        background: 'var(--s1)',
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: avatarColor, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600,
        position: 'relative', overflow: 'hidden', flexShrink: 0,
      }}>
        {initials(name)}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/users/${userId}/avatar`}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'none' }}
          onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      </div>
      <span className="chip-name" style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--dim)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M2 4l4 4 4-4" />
      </svg>
    </a>
  )
}
