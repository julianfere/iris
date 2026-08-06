'use client'

import { useCallback, useEffect, useState } from 'react'
import Sheet from '@/components/Sheet'
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
    <Sheet title="Invitar a alguien" onClose={onClose}>
      <p style={{ fontSize: 13.5, color: 'var(--dim)', margin: '0 0 16px', lineHeight: 1.5 }}>
        Cada código sirve para una sola persona y vence a los 7 días.
      </p>

      <button className="sheet-btn sheet-btn--primary" onClick={create} disabled={creating} style={{ width: '100%', marginBottom: 18 }}>
        {creating ? 'Generando…' : 'Generar invitación'}
      </button>

      {error && <p role="alert" style={{ color: '#f87171', fontSize: 13, marginBottom: 14, fontFamily: 'var(--mono)' }}>{error}</p>}

      {invites === null && <p style={{ fontSize: 13, color: 'var(--dim)' }}>Cargando…</p>}

      {invites?.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--dim)' }}>Todavía no invitaste a nadie.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {invites?.map(inv => {
          const st = statusOf(inv, now)
          const usable = st.tone === 'open'
          return (
            <div key={inv.code} style={{ borderBottom: '1px solid var(--line)', padding: '14px 0' }}>
              {/* Se apila si no entra: con el codigo y dos botones en una fila,
                  en 360px el ultimo boton quedaba fuera de pantalla. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 150px', minWidth: 0 }}>
                  <code style={{
                    fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 700, letterSpacing: '.04em',
                    color: usable ? 'var(--txt)' : 'var(--dim)',
                    textDecoration: st.tone === 'expired' ? 'line-through' : 'none',
                    display: 'block', overflowWrap: 'anywhere',
                  }}>{inv.code}</code>
                  <div style={{ fontSize: 12.5, color: 'var(--dim)', marginTop: 3 }}>{st.label}</div>
                </div>
                {usable && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => showQr(inv.code)} aria-label={`Ver QR de ${inv.code}`}
                      style={{ minHeight: 40, background: 'var(--s2)', border: '1px solid var(--line)', borderRadius: 8, color: 'var(--dim)', cursor: 'pointer', fontSize: 13, padding: '0 14px' }}>
                      QR
                    </button>
                    <button onClick={() => share(inv.code)}
                      style={{
                        minHeight: 40,
                        background: copied === inv.code ? 'color-mix(in srgb, var(--ac) 16%, transparent)' : 'var(--s2)',
                        border: '1px solid var(--line)', borderRadius: 8,
                        color: copied === inv.code ? 'var(--ac)' : 'var(--dim)',
                        cursor: 'pointer', fontSize: 13, padding: '0 14px', whiteSpace: 'nowrap',
                      }}>
                      {copied === inv.code ? '✓' : 'Compartir'}
                    </button>
                  </div>
                )}
              </div>
              {qr?.code === inv.code && (
                <img src={qr.url} alt={`QR de la invitación ${inv.code}`}
                  style={{ width: 220, maxWidth: '100%', borderRadius: 8, display: 'block', margin: '14px auto 4px' }} />
              )}
            </div>
          )
        })}
      </div>
    </Sheet>
  )
}
