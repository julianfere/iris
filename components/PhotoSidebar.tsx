'use client'

import { useState } from 'react'
import Link from 'next/link'
import { initials, formatBytes } from '@/lib/utils'
import FavoriteButton from '@/components/FavoriteButton'
import DeletePhotoButton from '@/components/DeletePhotoButton'
import EditPhotoSheet from '@/components/EditPhotoSheet'
import PhotoShareButton from '@/components/PhotoShareButton'

export type PhotoSidebarProps = {
  photoId: string
  title: string | null
  album: string | null
  tags: string[]
  size: number
  originalSize?: number | null
  mimeType: string
  originalName: string
  // Author
  userId: string
  userName: string
  userAvatarColor: string
  // Computed EXIF strings
  cam: string
  lens: string
  ap: string
  sh: string
  iso: string
  fl: string
  dim: string
  takenLabel: string
  takenTime: string
  waSize: number
  hasGps: boolean
  gpsLat: number | null
  gpsLon: number | null
  downloadable: boolean
  shareToken: string | null
  // State
  isFav: boolean
  favCount: number
  isOwn: boolean
}

export default function PhotoSidebar(p: PhotoSidebarProps) {
  const [exifOpen, setExifOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const exifRows = [
    ['Cámara',                p.cam],
    ['Objetivo',              p.lens],
    ['Apertura',              p.ap],
    ['Velocidad de obturación', p.sh],
    ['ISO',                   p.iso],
    ['Distancia focal',       p.fl],
    ['Dimensiones',           p.dim],
    ['Formato',               `${p.mimeType.split('/')[1]?.toUpperCase() ?? 'JPEG'} · ${formatBytes(p.size)}`],
    ['Tomada',                `${p.takenLabel} ${p.takenTime}`],
  ] as const

  return (
    <aside className="photo-sidebar">
      <style>{`@media (max-width: 767px) { .photo-sidebar { padding-left: 22px; padding-right: 22px; } }`}</style>
      {/* Author row */}
      <div className="author-row">
        <Link href={`/profile?userId=${p.userId}`} className="author-av" style={{ background: p.userAvatarColor, color: '#fff' }}>
          {initials(p.userName)}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/users/${p.userId}/avatar`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'none' }} onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        </Link>
        <div style={{ flex: 1 }}>
          <div className="author-name">{p.userName}</div>
          <div className="author-when">{p.takenLabel} · {p.takenTime}</div>
        </div>
        <FavoriteButton photoId={p.photoId} initialFav={p.isFav} initialCount={p.favCount} />
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="photo-ttl">{p.title}</h1>
          {p.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
              {p.tags.map(t => (
                <Link key={t} href={`/global/search?tag=${encodeURIComponent(t)}`} className="tag-chip">{t}</Link>
              ))}
            </div>
          )}
        </div>
        {p.isOwn && (
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <PhotoShareButton photoId={p.photoId} initialToken={p.shareToken} photoTitle={p.title} />
            <button
              onClick={() => setEditOpen(true)}
              title="Editar publicación"
              style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 8,
                padding: '6px 10px', cursor: 'pointer', color: 'var(--dim)',
                display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, flexShrink: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 1.5l2 2L4 11H2v-2L9.5 1.5z" />
              </svg>
              Editar
            </button>
          </div>
        )}
      </div>

      {/* Spec strip */}
      <div className="spec-strip">
        {([['Apertura', p.ap], ['Velocidad', p.sh], ['ISO', p.iso], ['Focal', p.fl]] as const).map(([k, v]) => (
          <div key={k} className="spec-cell">
            <div className="spec-v">{v}</div>
            <div className="spec-k">{k}</div>
          </div>
        ))}
      </div>

      {/* Download + Delete */}
      {(p.downloadable || p.isOwn) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
          <a
            className="btn-download"
            href={`/api/photos/${p.photoId}/original`}
            download={p.originalName}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v8M5 7l3 3 3-3M3 13.5h10" />
            </svg>
            Descargar original · {formatBytes(p.originalSize ?? p.size)}
          </a>
          {p.isOwn && <DeletePhotoButton photoId={p.photoId} />}
        </div>
      )}
      {!p.downloadable && !p.isOwn && (
        <div style={{ marginBottom: 10 }} />
      )}

      <div className="wa-note">
        <span className="ac">↯</span>
        <span>Por WhatsApp viajaría a ~{p.waSize} KB. Acá baja intacta: {p.dim}.</span>
      </div>

      {/* EXIF colapsable */}
      <button
        onClick={() => setExifOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 7, width: '100%',
          background: 'none', border: 'none', padding: '0 0 14px', cursor: 'pointer',
          color: 'var(--dim)', fontFamily: 'var(--font)', fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '.14em',
        }}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>Datos técnicos</span>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: 'transform .2s', transform: exifOpen ? 'rotate(180deg)' : 'none' }}
        >
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {exifOpen && (
        <>
          <div className="exif-rows">
            {exifRows.map(([k, v]) => (
              <div key={k} className="exif-row">
                <span className="exif-k">{k}</span>
                <span className="exif-v">{v}</span>
              </div>
            ))}
          </div>

          {p.hasGps && p.gpsLat !== null && p.gpsLon !== null && (
            <>
              <div className="loc-label">Ubicación</div>
              <div className="loc-box">
                <div className="loc-map">
                  <div className="loc-dot" />
                  <div className="loc-ring" />
                </div>
                <div className="loc-coords">
                  <span className="loc-place">{p.gpsLat.toFixed(3)}, {p.gpsLon.toFixed(3)}</span>
                  <span className="loc-gps">{p.gpsLat.toFixed(5)}°, {p.gpsLon.toFixed(5)}°</span>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {editOpen && (
        <EditPhotoSheet
          photoId={p.photoId}
          initialTitle={p.title}
          initialTags={p.tags}
          initialDownloadable={p.downloadable}
          onClose={() => setEditOpen(false)}
        />
      )}
    </aside>
  )
}
