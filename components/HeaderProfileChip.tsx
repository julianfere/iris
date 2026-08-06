'use client'

import Link from 'next/link'
import UserAvatar from '@/components/UserAvatar'

type Props = {
  userId: string
  name: string
  avatarColor: string
  hasAvatar?: boolean
}

export default function HeaderProfileChip({ userId, name, avatarColor, hasAvatar }: Props) {
  return (
    // Link y no <a>: un <a> forzaba una recarga completa del documento en
    // cada visita al perfil.
    <Link
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
      <UserAvatar
        userId={userId}
        name={name}
        avatarColor={avatarColor}
        hasAvatar={hasAvatar}
        style={{ width: 28, height: 28, borderRadius: '50%', fontSize: 11, flexShrink: 0 }}
      />
      <span className="chip-name" style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </span>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--dim)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M2 4l4 4 4-4" />
      </svg>
    </Link>
  )
}
