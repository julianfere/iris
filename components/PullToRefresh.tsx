'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const THRESHOLD = 72

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const progressRef = useRef(0)
  const startYRef = useRef(0)
  const activeRef = useRef(false)

  useEffect(() => {
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
      if (progressRef.current >= 1) {
        setRefreshing(true)
        router.refresh()
        setTimeout(() => {
          setRefreshing(false)
          setProgress(0)
          progressRef.current = 0
        }, 1200)
      } else {
        setProgress(0)
        progressRef.current = 0
      }
      startYRef.current = 0
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [router])

  const visible = progress > 0 || refreshing

  return (
    <>
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
          opacity: refreshing ? 1 : progress,
          transform: `scale(${0.55 + 0.45 * Math.min(progress, 1)})`,
          transition: refreshing ? 'opacity .2s' : 'none',
        }}>
          {refreshing ? (
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
              style={{
                transform: `rotate(${Math.min(progress, 1) * 180}deg)`,
                transition: 'none',
              }}
            >
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          )}
        </div>
      </div>
      {children}
    </>
  )
}
