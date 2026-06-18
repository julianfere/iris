'use client'

import { initials } from '@/lib/utils'

type Props = {
  userId: string
  name: string
  avatarColor: string
  className?: string
  style?: React.CSSProperties
}

export default function UserAvatar({ userId, name, avatarColor, className, style }: Props) {
  return (
    <div
      className={className}
      style={{
        background: avatarColor, color: '#fff',
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600,
        ...style,
      }}
    >
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
  )
}
