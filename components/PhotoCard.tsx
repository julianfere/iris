'use client'

import Link from 'next/link'
import { formatBytes } from '@/lib/utils'
import UserAvatar from '@/components/UserAvatar'

type Props = {
  photoId: string
  userId: string | null
  avatarColor: string | null
  userName: string | null
  title: string | null
  cam: string
  fl: string
  size: number
  hasOriginal: boolean
  aspectRatio: number
  timeLabel: string
  tags: string[]
  /** Overrides the default `/global/photo/[id]` target — used to carry the active filter as context. */
  href?: string
  selectMode?: boolean
  selected?: boolean
  onToggleSelect?: () => void
}

export default function PhotoCard({
  photoId, userId, avatarColor, userName,
  title, cam, fl, size, hasOriginal, aspectRatio, timeLabel, tags,
  href, selectMode, selected, onToggleSelect,
}: Props) {
  const target = href ?? `/global/photo/${photoId}`
  const label = title || 'Foto sin título'

  function onNestedClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (selectMode) e.preventDefault()
  }

  const meta = (
    <>
      <div className="photo-overlay">
        <div className="orig-badge">● {hasOriginal ? 'ORIGINAL' : 'WEBP'} · {formatBytes(size)}</div>
        <div>
          <div className="overlay-title">{title}</div>
          <div className="overlay-cam">{cam}{fl ? ' · ' + fl : ''}</div>
        </div>
      </div>
      <div className="mobile-badge">● {hasOriginal ? 'ORIGINAL' : 'WEBP'} · {formatBytes(size)}</div>
    </>
  )

  const image = (
    <img
      src={`/api/photos/${photoId}/thumb`}
      alt={label}
      style={{ aspectRatio: aspectRatio }}
      loading="lazy"
    />
  )

  const check = selectMode && (
    <div className={`select-check${selected ? ' select-check--on' : ''}`} aria-hidden="true">
      {selected && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 6.2l2.4 2.4L9.5 3.4" />
        </svg>
      )}
    </div>
  )

  // En modo seleccion la tarjeta es un boton con estado; fuera de el, un
  // enlace de verdad. Antes era siempre un <div onClick>: no se enfocaba con
  // Tab, no respondia a Enter y ningun lector de pantalla lo anunciaba.
  const body = (
    <>
      {check}
      {image}
      {meta}
    </>
  )

  return (
    <div className={`photo-card${selected ? ' photo-card--selected' : ''}`}>
      {selectMode ? (
        <button
          type="button"
          onClick={onToggleSelect}
          aria-pressed={selected}
          aria-label={`${selected ? 'Quitar de la selección' : 'Seleccionar'}: ${label}`}
          className="photo-card-hit"
          style={{ display: 'contents', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          {body}
        </button>
      ) : (
        <Link href={target} className="photo-card-hit" style={{ display: 'contents' }} aria-label={label}>
          {body}
        </Link>
      )}

      <div className="mobile-meta">
        <Link
          href={userId ? `/profile?userId=${userId}` : '/global/search'}
          className="m-av"
          onClick={onNestedClick}
          aria-label={userName ? `Ver el perfil de ${userName}` : 'Buscar'}
          style={{ padding: 0, border: 'none' }}
        >
          <UserAvatar
            userId={userId}
            name={userName ?? ''}
            avatarColor={avatarColor ?? 'var(--s2)'}
            style={{ width: '100%', height: '100%', borderRadius: '50%', fontSize: 'inherit' }}
          />
        </Link>
        <div className="m-info">
          <div className="m-title">{title}</div>
          <div className="m-cam">{cam}{fl ? ' · ' + fl : ''}</div>
        </div>
        <span className="m-time">{timeLabel}</span>
      </div>

      <div className="mobile-tags" onClick={onNestedClick}>
        {tags.map(t => (
          <Link key={t} href={`/global/search?tag=${encodeURIComponent(t)}`} className="tag-chip">
            {t}
          </Link>
        ))}
      </div>
    </div>
  )
}
