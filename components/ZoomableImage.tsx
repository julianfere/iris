'use client'

import { useState, useRef, useEffect } from 'react'

type Pt = { x: number; y: number }

export default function ZoomableImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState<Pt>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const scaleRef = useRef(1)
  const offsetRef = useRef<Pt>({ x: 0, y: 0 })
  scaleRef.current = scale
  offsetRef.current = offset

  const dragStart = useRef<Pt>({ x: 0, y: 0 })
  const dragBase = useRef<Pt>({ x: 0, y: 0 })
  const dragActive = useRef(false)
  const pinchBase = useRef<{ dist: number; scale: number; offset: Pt } | null>(null)
  const lastTap = useRef(0)

  // Clamp offset so scaled image can't go fully out of the wrapper bounds.
  // Uses the *rendered* image size (imgRef) vs wrapper size (wrapRef).
  function clamp(ox: number, oy: number, s: number): Pt {
    const wrap = wrapRef.current
    const img = imgRef.current
    if (!wrap || !img) return { x: ox, y: oy }
    const maxX = Math.max(0, (img.clientWidth * s - wrap.clientWidth) / 2)
    const maxY = Math.max(0, (img.clientHeight * s - wrap.clientHeight) / 2)
    return {
      x: Math.max(-maxX, Math.min(maxX, ox)),
      y: Math.max(-maxY, Math.min(maxY, oy)),
    }
  }

  function applyZoom(ns: number, cx: number, cy: number, baseScale: number, baseOffset: Pt) {
    const s = Math.max(1, Math.min(5, ns))
    if (s <= 1) {
      setScale(1); setOffset({ x: 0, y: 0 })
      scaleRef.current = 1; offsetRef.current = { x: 0, y: 0 }
      return
    }
    const wrap = wrapRef.current
    if (!wrap) return
    const rect = wrap.getBoundingClientRect()
    const ratio = s / baseScale
    const px = cx - rect.left - wrap.clientWidth / 2
    const py = cy - rect.top - wrap.clientHeight / 2
    const clamped = clamp(px * (1 - ratio) + baseOffset.x * ratio, py * (1 - ratio) + baseOffset.y * ratio, s)
    setScale(s); setOffset(clamped)
    scaleRef.current = s; offsetRef.current = clamped
  }

  // Non-passive wheel + touchmove so e.preventDefault() actually works
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      applyZoom(scaleRef.current * (e.deltaY > 0 ? 0.85 : 1.18), e.clientX, e.clientY, scaleRef.current, offsetRef.current)
    }
    const onTouchMove = (e: TouchEvent) => { if (scaleRef.current > 1) e.preventDefault() }
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => { el.removeEventListener('wheel', onWheel); el.removeEventListener('touchmove', onTouchMove) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onDoubleClick(e: React.MouseEvent) {
    if (scaleRef.current > 1) applyZoom(1, 0, 0, 1, { x: 0, y: 0 })
    else applyZoom(2.5, e.clientX, e.clientY, 1, { x: 0, y: 0 })
  }

  function onMouseDown(e: React.MouseEvent) {
    if (scaleRef.current <= 1) return
    dragActive.current = true; setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    dragBase.current = { ...offsetRef.current }
    e.preventDefault()
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragActive.current) return
    const c = clamp(dragBase.current.x + e.clientX - dragStart.current.x, dragBase.current.y + e.clientY - dragStart.current.y, scaleRef.current)
    setOffset(c); offsetRef.current = c
  }

  function stopDrag() { dragActive.current = false; setDragging(false) }

  function onTouchStart(e: React.TouchEvent) {
    if (scaleRef.current > 1) e.stopPropagation()
    if (e.touches.length === 2) {
      dragActive.current = false; setDragging(false)
      const [a, b] = [e.touches[0], e.touches[1]]
      pinchBase.current = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), scale: scaleRef.current, offset: { ...offsetRef.current } }
    } else if (e.touches.length === 1) {
      const now = Date.now()
      if (now - lastTap.current < 300) {
        lastTap.current = 0
        const t = e.touches[0]
        if (scaleRef.current > 1) applyZoom(1, 0, 0, 1, { x: 0, y: 0 })
        else applyZoom(2.5, t.clientX, t.clientY, 1, { x: 0, y: 0 })
        return
      }
      lastTap.current = now
      if (scaleRef.current > 1) {
        dragActive.current = true; setDragging(true)
        dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        dragBase.current = { ...offsetRef.current }
      }
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (scaleRef.current > 1) e.stopPropagation()
    if (e.touches.length === 2 && pinchBase.current) {
      const [a, b] = [e.touches[0], e.touches[1]]
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
      const mid = { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
      applyZoom(pinchBase.current.scale * d / pinchBase.current.dist, mid.x, mid.y, pinchBase.current.scale, pinchBase.current.offset)
    } else if (e.touches.length === 1 && dragActive.current) {
      const c = clamp(dragBase.current.x + e.touches[0].clientX - dragStart.current.x, dragBase.current.y + e.touches[0].clientY - dragStart.current.y, scaleRef.current)
      setOffset(c); offsetRef.current = c
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (e.touches.length < 2) pinchBase.current = null
    if (e.touches.length === 0) stopDrag()
  }

  return (
    <div
      ref={wrapRef}
      style={{
        // Fill the entire photo-img-panel (flex parent on desktop)
        flex: '1 1 auto',
        alignSelf: 'stretch',
        // Center the image inside
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Clip zoomed overflow at panel bounds
        position: 'relative',
        overflow: 'hidden',
        touchAction: scale > 1 ? 'none' : 'auto',
        cursor: scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in',
      }}
      onDoubleClick={onDoubleClick}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={className}
        draggable={false}
        loading="eager"
        style={{
          display: 'block',
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: dragging ? 'none' : 'transform .18s ease',
          userSelect: 'none',
          willChange: scale > 1 ? 'transform' : 'auto',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
