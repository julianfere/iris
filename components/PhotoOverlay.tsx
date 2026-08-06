'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PhotoSidebar, { type PhotoSidebarProps } from '@/components/PhotoSidebar'
import ZoomableImage from '@/components/ZoomableImage'

type Props = PhotoSidebarProps & {
  prevId: string | null
  nextId: string | null
  /** 0-based position within the current context (feed or active filter). */
  index: number
  total: number
  /** Querystring (no leading `?`) carrying the active filter, so prev/next stay within it. */
  navQuery?: string
}

// Module-level flag: true while the overlay is open across navigations
let overlayOpen = false

export default function PhotoOverlay({ prevId, nextId, index, total, navQuery, ...sidebarProps }: Props) {
  const router = useRouter()
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const animateIn = !overlayOpen

  const { photoId } = sidebarProps

  function close() {
    overlayOpen = false
    router.back()
  }

  function goTo(id: string) {
    router.replace(`/global/photo/${id}${navQuery ? '?' + navQuery : ''}`)
  }

  useEffect(() => {
    overlayOpen = true
    return () => { overlayOpen = false }
  }, [])

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
    touchStartY.current = e.touches[0].clientY
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
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
        animation: animateIn ? 'cr-fade .15s ease both' : undefined,
      }}
      onClick={e => { if (e.target === e.currentTarget) close() }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={close}
        style={{
          position: 'absolute', top: 'calc(16px + env(safe-area-inset-top))', right: 16, zIndex: 10,
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

      {/* Content: image + sidebar */}
      <div
        className="photo-split photo-split--overlay"
        style={{ flex: 1 }}
      >
        {/* Image panel */}
        <div className="photo-img-panel" style={{ background: 'transparent' }}>
          <ZoomableImage
            src={`/api/photos/${photoId}/display`}
            alt={sidebarProps.title ?? ''}
            className="photo-main"
          />

          {/* Position counter — same reasoning as the arrows: scoped to the image panel */}
          {total > 1 && (
            <div
              style={{
                position: 'absolute', top: 'calc(16px + env(safe-area-inset-top))', left: '50%', transform: 'translateX(-50%)', zIndex: 10,
                background: 'rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.15)',
                color: '#fff', fontFamily: 'var(--mono)', fontSize: 11.5,
                padding: '5px 10px', borderRadius: 20, backdropFilter: 'blur(8px)',
                pointerEvents: 'none',
              }}
            >
              {index + 1} / {total}
            </div>
          )}

          {/* Prev arrow — scoped to the image panel so it stays over the photo,
              not over the sidebar next to it (desktop) or below it (mobile) */}
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
        </div>

        {/* Sidebar */}
        <PhotoSidebar {...sidebarProps} />
      </div>
    </div>
  )
}
