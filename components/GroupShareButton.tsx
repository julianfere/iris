'use client'

import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'

type Props = {
  groupName: string
  inviteCode: string
}

export default function GroupShareButton({ groupName, inviteCode }: Props) {
  const [open, setOpen]         = useState(false)
  const [copied, setCopied]     = useState(false)
  const [qrUrl, setQrUrl]       = useState<string | null>(null)
  const popoverRef              = useRef<HTMLDivElement>(null)

  const joinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/join/${inviteCode}`
    : `/join/${inviteCode}`

  // Generate QR when popover opens
  useEffect(() => {
    if (!open || qrUrl) return
    QRCode.toDataURL(joinUrl, { width: 180, margin: 1, color: { dark: '#e8e8e8', light: '#161618' } })
      .then(url => setQrUrl(url))
      .catch(() => {})
  }, [open, joinUrl, qrUrl])

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

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Unirse a ${groupName} en Iris`,
          text: `Código de invitación: ${inviteCode}`,
          url: joinUrl,
        })
      } catch {
        // user cancelled — no-op
      }
      return
    }
    setOpen(o => !o)
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // fallback: select text
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleShare}
        title="Compartir grupo"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--dim)', padding: '6px 8px', borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'color .15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--txt)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--dim)')}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="3" r="1.5"/><circle cx="12" cy="13" r="1.5"/><circle cx="4" cy="8" r="1.5"/>
          <path d="M10.5 3.8L5.5 7.2M10.5 12.2L5.5 8.8"/>
        </svg>
      </button>

      {open && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 500,
            background: 'var(--s1)', border: '1px solid var(--line)',
            borderRadius: 12, padding: 16, width: 220,
            boxShadow: '0 8px 32px rgba(0,0,0,.4)',
            animation: 'cr-fade .12s ease both',
          }}
        >
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--dim)', marginBottom: 10 }}>
            Compartir acceso
          </div>

          {/* Invite code + copy */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <code style={{
              flex: 1, fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700,
              letterSpacing: '.08em', color: 'var(--txt)',
            }}>
              {inviteCode}
            </code>
            <button
              onClick={copyCode}
              style={{
                background: copied ? 'color-mix(in srgb, var(--ac) 16%, transparent)' : 'var(--s2)',
                border: '1px solid var(--line)', borderRadius: 6,
                color: copied ? 'var(--ac)' : 'var(--dim)',
                cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12,
                padding: '5px 9px', transition: 'all .15s', whiteSpace: 'nowrap',
              }}
            >
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>

          {/* QR */}
          {qrUrl ? (
            <img
              src={qrUrl}
              alt="QR de invitación"
              style={{ width: '100%', borderRadius: 8, display: 'block' }}
            />
          ) : (
            <div style={{ height: 180, background: 'var(--s2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--dim)' }}>Generando QR…</span>
            </div>
          )}

          <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 10, lineHeight: 1.5 }}>
            Escaneá o mandá el código para invitar.
          </div>
        </div>
      )}
    </div>
  )
}
