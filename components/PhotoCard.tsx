'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { initials, formatBytes } from '@/lib/utils'

type Props = {
  photoId: string
  userId: string | null
  avatarColor: string | null
  userName: string | null
  title: string | null
  cam: string
  fl: string
  size: number
  originalSize?: number | null
  aspectRatio: number
  timeLabel: string
  tags: string[]
}

export default function PhotoCard({
  photoId, userId, avatarColor, userName,
  title, cam, fl, size, originalSize, aspectRatio, timeLabel, tags,
}: Props) {
  const router = useRouter()

  return (
    <div
      className="photo-card"
      style={{ cursor: 'pointer' }}
      onClick={() => router.push(`/global/photo/${photoId}`)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/photos/${photoId}/thumb`}
        alt={title ?? ''}
        style={{ aspectRatio: aspectRatio }}
        loading="lazy"
      />
      <div className="photo-overlay">
        <div className="orig-badge">● ORIGINAL · {formatBytes(originalSize ?? size)}</div>
        <div>
          <div className="overlay-title">{title}</div>
          <div className="overlay-cam">{cam}{fl ? ' · ' + fl : ''}</div>
        </div>
      </div>
      <div className="mobile-badge">● ORIGINAL · {formatBytes(originalSize ?? size)}</div>
      <div className="mobile-meta">
        <Link
          href={userId ? `/profile?userId=${userId}` : '/global/search'}
          className="m-av"
          style={{ background: avatarColor ?? 'var(--s2)' }}
          onClick={e => e.stopPropagation()}
        >
          {initials(userName ?? '')}
          {userId && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/users/${userId}/avatar`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          )}
        </Link>
        <div className="m-info">
          <div className="m-title">{title}</div>
          <div className="m-cam">{cam}{fl ? ' · ' + fl : ''}</div>
        </div>
        <span className="m-time">{timeLabel}</span>
      </div>
      <div className="mobile-tags" onClick={e => e.stopPropagation()}>
        {tags.map(t => (
          <Link key={t} href={`/global/search?tag=${encodeURIComponent(t)}`} className="tag-chip">
            {t}
          </Link>
        ))}
      </div>
    </div>
  )
}
