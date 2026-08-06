'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const THRESHOLD = 72

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [isPending, startTransition] = useTransition()
  const progressRef = useRef(0)
  const startYRef = useRef(0)
  const activeRef = useRef(false)
  // Los listeners viven en este nodo y no en window: el visor se monta encima
  // del feed como ruta interceptada, asi que arrastrar dentro del visor
  // disparaba el refresh del feed que estaba atras.
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 5) return
      startYRef.current = e.touches[0].clientY
      activeRef.current = true
    }

    function onTouchMove(e: TouchEvent) {
      if (!activeRef.current || window.scrollY > 5) return
      const dy = e.touches[0].clientY - startYRef.current
      if (dy > 0) {
        const p = Math.min(dy / THRESHOLD, 1)
        progressRef.current = p
        setProgress(p)
      }
    }

    function onTouchEnd() {
      if (!activeRef.current) return
      activeRef.current = false
      const shouldRefresh = progressRef.current >= 1
      progressRef.current = 0
      setProgress(0)
      startYRef.current = 0
      // El indicador vive lo que tarda el refresh de verdad. Antes era un
      // setTimeout de 1200 ms fijo, asi que desaparecia antes de que llegara
      // el contenido o giraba de gusto.
      if (shouldRefresh) startTransition(() => router.refresh())
    }

    host.addEventListener('touchstart', onTouchStart, { passive: true })
    host.addEventListener('touchmove', onTouchMove, { passive: true })
    host.addEventListener('touchend', onTouchEnd, { passive: true })
    host.addEventListener('touchcancel', onTouchEnd, { passive: true })

    return () => {
      host.removeEventListener('touchstart', onTouchStart)
      host.removeEventListener('touchmove', onTouchMove)
      host.removeEventListener('touchend', onTouchEnd)
      host.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [router])

  const visible = progress > 0 || isPending

  return (
    <div ref={hostRef}>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        height: visible ? 44 : 0,
        alignItems: 'center',
        overflow: 'hidden',
        transition: 'height .25s ease',
        pointerEvents: 'none',
      }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--s2)',
          border: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: isPending ? 1 : progress,
          transform: `scale(${0.55 + 0.45 * Math.min(progress, 1)})`,
          transition: isPending ? 'opacity .2s' : 'none',
        }}>
          {isPending ? (
            <svg
              width="15" height="15" viewBox="0 0 24 24"
              fill="none" stroke="var(--ac)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: 'ptr-spin .75s linear infinite' }}
            >
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v5h-5" />
            </svg>
          ) : (
            <svg
              width="13" height="13" viewBox="0 0 24 24"
              fill="none" stroke="var(--ac)" strokeWidth="2.2" strokeLinecap="round"
              style={{ transform: `rotate(${Math.min(progress, 1) * 180}deg)`, transition: 'none' }}
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
