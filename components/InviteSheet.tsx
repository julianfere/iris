'use client'

import { useCallback, useEffect, useState } from 'react'
import QRCode from 'qrcode'

type Invite = {
  code: string
  usedBy: string | null
  usedByName: string | null
  expiresAt: number
  createdAt: number
}

function statusOf(inv: Invite, now: number) {
  if (inv.usedBy) return { label: `Usada por ${inv.usedByName ?? 'alguien'}`, tone: 'used' as const }
  if (inv.expiresAt < now) return { label: 'Vencida', tone: 'expired' as const }
  const days = Math.max(1, Math.ceil((inv.expiresAt - now) / 86_400_000))
  return { label: `Vence en ${days} día${days !== 1 ? 's' : ''}`, tone: 'open' as const }
}

export default function InviteSheet({ onClose }: { onClose: () => void }) {
  const [invites, setInvites] = useState<Invite[] | null>(null)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [qr, setQr] = useState<{ code: string; url: string } | null>(null)
  // Se fija una vez al montar: usarlo directo en el render haría que el
  // estado de cada invitacion cambie entre el server y el cliente.
  const [now] = useState(() => Date.now())

  // Se incrementa para pedir una recarga; el fetch vive dentro del effect
  // para que quede claro que los setState ocurren despues del await.
  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey(k => k + 1), [])

  useEffect(() => {
    const ac = new AbortController()
    ;(async () => {
      try {
        const res = await fetch('/api/invites', { signal: ac.signal })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setInvites(data.invites)
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return
        setError('No pudimos cargar tus invitaciones.')
      }
    })()
    return () => ac.abort()
  }, [reloadKey])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function joinUrl(code: string) {
    return `${window.location.origin}/join/${code}`
  }

  async function create() {
    setCreating(true); setError('')
    try {
      const res = await fetch('/api/invites', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'No se pudo crear la invitación.'); return }
      reload()
      await showQr(data.code)
    } catch {
      setError('No se pudo crear la invitación.')
    } finally {
      setCreating(false)
    }
  }

  async function showQr(code: string) {
    if (qr?.code === code) { setQr(null); return }
    try {
      const url = await QRCode.toDataURL(joinUrl(code), {
        width: 220, margin: 1, color: { dark: '#e8e8e8', light: '#161618' },
      })
      setQr({ code, url })
    } catch {
      setError('No se pudo generar el QR.')
    }
  }

  async function share(code: string) {
    const url = joinUrl(code)
    if (navigator.share) {
      try { await navigator.share({ title: 'Te invito a Iris', text: `Entrá al carrete: ${code}`, url }); return } catch { /* cancelado */ }
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(code)
      setTimeout(() => setCopied(c => (c === code ? null : c)), 1800)
    } catch {
      setError('No se pudo copiar el link.')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Invitar a alguien"
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'cr-fade .15s ease both',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100%', maxHeight: '92dvh', background: 'var(--bg)',
        borderRadius: '18px 18px 0 0', borderTop: '1px solid var(--line)',
        overflowY: 'auto', animation: 'sheet-up .22s cubic-bezier(.32,1,.28,1) both',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 20px 0' }}>
          <span style={{ flex: 1, fontWeight: 600, fontSize: 16 }}>Invitar a alguien</span>
          <button onClick={onClose} aria-label="Cerrar"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dim)', padding: 6, borderRadius: 6 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M2 2l12 12M14 2L2 14" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '16px 20px calc(28px + env(safe-area-inset-bottom))' }}>
          <p style={{ fontSize: 13, color: 'var(--dim)', margin: '0 0 16px', lineHeight: 1.5 }}>
            Cada código sirve para una sola persona y vence a los 7 días.
          </p>

          <button className="btn-primary" onClick={create} disabled={creating} style={{ marginBottom: 18 }}>
            {creating ? 'Generando…' : 'Generar invitación'}
          </button>

          {error && <p role="alert" style={{ color: '#f87171', fontSize: 13, marginBottom: 14, fontFamily: 'var(--mono)' }}>{error}</p>}

          {invites === null && <p style={{ fontSize: 13, color: 'var(--dim)' }}>Cargando…</p>}

          {invites?.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--dim)' }}>Todavía no invitaste a nadie.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {invites?.map(inv => {
              const st = statusOf(inv, now)
              const usable = st.tone === 'open'
              return (
                <div key={inv.code} style={{ borderBottom: '1px solid var(--line)', padding: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <code style={{
                        fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, letterSpacing: '.06em',
                        color: usable ? 'var(--txt)' : 'var(--dim)',
                        textDecoration: st.tone === 'expired' ? 'line-through' : 'none',
                      }}>{inv.code}</code>
                      <div style={{ fontSize: 12, color: st.tone === 'open' ? 'var(--dim)' : 'var(--dim)', marginTop: 3 }}>
                        {st.label}
                      </div>
                    </div>
                    {usable && (
                      <>
                        <button onClick={() => showQr(inv.code)} aria-label={`Ver QR de ${inv.code}`}
                          style={{ background: 'var(--s2)', border: '1px solid var(--line)', borderRadius: 6, color: 'var(--dim)', cursor: 'pointer', fontSize: 12, padding: '6px 10px' }}>
                          QR
                        </button>
                        <button onClick={() => share(inv.code)}
                          style={{
                            background: copied === inv.code ? 'color-mix(in srgb, var(--ac) 16%, transparent)' : 'var(--s2)',
                            border: '1px solid var(--line)', borderRadius: 6,
                            color: copied === inv.code ? 'var(--ac)' : 'var(--dim)',
                            cursor: 'pointer', fontSize: 12, padding: '6px 10px', whiteSpace: 'nowrap',
                          }}>
                          {copied === inv.code ? '✓ Copiado' : 'Compartir'}
                        </button>
                      </>
                    )}
                  </div>
                  {qr?.code === inv.code && (
                    <img src={qr.url} alt={`QR de la invitación ${inv.code}`}
                      style={{ width: 220, maxWidth: '100%', borderRadius: 8, display: 'block', margin: '12px auto 4px' }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
