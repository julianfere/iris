'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PhotoSidebar, { type PhotoSidebarProps } from '@/components/PhotoSidebar'

type Props = PhotoSidebarProps & {
  prevId: string | null
  nextId: string | null
}

export default function PhotoOverlay({ prevId, nextId, ...sidebarProps }: Props) {
  const router = useRouter()
  const touchStartX = useRef<number | null>(null)

  const { photoId } = sidebarProps

  function close() { router.back() }

  function goTo(id: string) {
    router.push(`/global/photo/${id}`)
  }

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')     close()
      if (e.key === 'ArrowLeft'  && prevId) goTo(prevId)
      if (e.key === 'ArrowRight' && nextId) goTo(nextId)
    }
    window.addEventListener('keydown', onKey)
    // Lock body scroll while overlay is open
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevId, nextId])

  // Preload adjacent thumbnails
  useEffect(() => {
    for (const id of [prevId, nextId]) {
      if (!id) continue
      const img = new Image()
      img.src = `/api/photos/${id}/thumb`
    }
  }, [prevId, nextId])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 40) return
    if (dx < 0 && nextId) goTo(nextId)  // swipe left → next (older)
    if (dx > 0 && prevId) goTo(prevId)  // swipe right → prev (newer)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.85)',
        backdropFilter: 'blur(2px)',
        display: 'flex', flexDirection: 'column',
        animation: 'cr-fade .15s ease both',
      }}
      onClick={e => { if (e.target === e.currentTarget) close() }}
    >
      {/* Close button */}
      <button
        onClick={close}
        style={{
          position: 'absolute', top: 16, right: 16, zIndex: 10,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.15)',
          color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
        }}
        aria-label="Cerrar"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M2 2l10 10M12 2L2 12" />
        </svg>
      </button>

      {/* Prev arrow */}
      {prevId && (
        <button
          onClick={() => goTo(prevId)}
          style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.15)',
            color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}
          aria-label="Foto anterior"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 3L4.5 7l4 4" />
          </svg>
        </button>
      )}

      {/* Next arrow */}
      {nextId && (
        <button
          onClick={() => goTo(nextId)}
          style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 10,
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.15)',
            color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(8px)',
          }}
          aria-label="Foto siguiente"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5.5 3l4 4-4 4" />
          </svg>
        </button>
      )}

      {/* Content: image + sidebar */}
      <div
        className="photo-split"
        style={{ flex: 1, overflow: 'hidden' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Image panel */}
        <div className="photo-img-panel" style={{ background: 'transparent' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/photos/${photoId}/thumb`}
            alt={sidebarProps.title ?? ''}
            className="photo-main"
            loading="eager"
          />
        </div>

        {/* Sidebar */}
        <PhotoSidebar {...sidebarProps} />
      </div>
    </div>
  )
}
