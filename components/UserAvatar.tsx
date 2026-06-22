'use client'

import { useState, useRef, useEffect } from 'react'
import { initials } from '@/lib/utils'

type Props = {
  userId: string
  name: string
  avatarColor: string
  className?: string
  style?: React.CSSProperties
}

export default function UserAvatar({ userId, name, avatarColor, className, style }: Props) {
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true)
  }, [])

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
      <img
        ref={imgRef}
        src={`/api/users/${userId}/avatar`}
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: loaded ? 'block' : 'none' }}
        onLoad={() => setLoaded(true)}
        onError={() => {}}
      />
    </div>
  )
}
