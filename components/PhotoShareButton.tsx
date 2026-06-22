'use client'

import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'

type Props = {
  photoId: string
  initialToken: string | null
  photoTitle: string | null
}

export default function PhotoShareButton({ photoId, initialToken, photoTitle }: Props) {
  const [token, setToken]   = useState<string | null>(initialToken)
  const [open, setOpen]     = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [qrUrl, setQrUrl]   = useState<string | null>(null)
  const popoverRef          = useRef<HTMLDivElement>(null)

  const shareUrl = typeof window !== 'undefined' && token
    ? `${window.location.origin}/s/${token}`
    : token ? `/s/${token}` : null

  async function ensureToken(): Promise<string> {
    if (token) return token
    setLoading(true)
    try {
      const res = await fetch(`/api/photos/${photoId}/share`, { method: 'POST' })
      const data = await res.json()
      setToken(data.token)
      return data.token as string
    } finally {
      setLoading(false)
    }
  }

  async function handleShare() {
    const t = await ensureToken()
    const url = `${window.location.origin}/s/${t}`
    if (navigator.share) {
      try {
        await navigator.share({ title: photoTitle ?? 'Foto en Iris', url })
      } catch {
        // user cancelled
      }
      return
    }
    setOpen(o => !o)
  }

  async function handleRevoke() {
    setLoading(true)
    try {
      await fetch(`/api/photos/${photoId}/share`, { method: 'DELETE' })
      setToken(null)
      setQrUrl(null)
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  async function copyUrl() {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  // Generate QR when popover opens and token exists
  useEffect(() => {
    if (!open || !shareUrl || qrUrl) return
    QRCode.toDataURL(shareUrl, { width: 180, margin: 1, color: { dark: '#e8e8e8', light: '#161618' } })
      .then(url => setQrUrl(url))
      .catch(() => {})
  }, [open, shareUrl, qrUrl])

  // Reset QR when token changes (after revoke)
  useEffect(() => {
    if (!token) setQrUrl(null)
  }, [token])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleShare}
        disabled={loading}
        title="Compartir foto"
        style={{
          background: 'none', border: '1px solid var(--line)', borderRadius: 8,
          padding: '7px 12px', cursor: loading ? 'wait' : 'pointer',
          color: token ? 'var(--ac)' : 'var(--dim)',
          display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
          fontFamily: 'var(--font)', transition: 'color .15s',
        }}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="3" r="1.5"/><circle cx="12" cy="13" r="1.5"/><circle cx="4" cy="8" r="1.5"/>
          <path d="M10.5 3.8L5.5 7.2M10.5 12.2L5.5 8.8"/>
        </svg>
        {token ? 'Compartido' : 'Compartir'}
      </button>

      {open && shareUrl && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 500,
            background: 'var(--s1)', border: '1px solid var(--line)',
            borderRadius: 12, padding: 16, width: 240,
            boxShadow: '0 8px 32px rgba(0,0,0,.4)',
            animation: 'cr-fade .12s ease both',
          }}
        >
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', marginBottom: 10 }}>
            Enlace público
          </div>

          {/* URL + copy */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <input
              readOnly
              value={shareUrl}
              style={{
                flex: 1, minWidth: 0,
                fontFamily: 'var(--mono)', fontSize: 10,
                background: 'var(--s2)', border: '1px solid var(--line)',
                borderRadius: 6, padding: '5px 7px', color: 'var(--txt)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
              onFocus={e => e.target.select()}
            />
            <button
              onClick={copyUrl}
              style={{
                background: copied ? 'color-mix(in srgb, var(--ac) 16%, transparent)' : 'var(--s2)',
                border: '1px solid var(--line)', borderRadius: 6,
                color: copied ? 'var(--ac)' : 'var(--dim)',
                cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12,
                padding: '5px 9px', transition: 'all .15s', whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {copied ? '✓' : 'Copiar'}
            </button>
          </div>

          {/* QR */}
          {qrUrl ? (
            <img src={qrUrl} alt="QR del enlace" style={{ width: '100%', borderRadius: 8, display: 'block' }} />
          ) : (
            <div style={{ height: 180, background: 'var(--s2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--dim)' }}>Generando QR…</span>
            </div>
          )}

          {/* Revoke */}
          <button
            onClick={handleRevoke}
            disabled={loading}
            style={{
              marginTop: 12, width: '100%',
              background: 'none', border: '1px solid var(--line)',
              borderRadius: 6, padding: '6px 10px',
              cursor: loading ? 'wait' : 'pointer',
              color: 'var(--dim)', fontFamily: 'var(--font)', fontSize: 12,
              transition: 'color .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#e55')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--dim)')}
          >
            Revocar enlace
          </button>
        </div>
      )}
    </div>
  )
}
