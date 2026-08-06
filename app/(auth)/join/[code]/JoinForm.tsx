'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function JoinForm({ code }: { code: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: pass, inviteCode: code }),
      })
      if (!res.ok) { setError((await res.json()).error ?? 'No se pudo crear la cuenta'); return }

      const result = await signIn('credentials', { email, password: pass, redirect: false })
      if (result?.error) { setError('Cuenta creada, pero no pudimos entrar. Probá desde la pantalla de login.'); return }
      router.push('/global')
    } catch {
      setError('No se pudo crear la cuenta. Probá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-split">
      <div className="auth-left">
        <div className="auth-left-logo">
          <div className="logo-sq" />
          <span className="logo-txt">Iris</span>
        </div>
        <div className="auth-left-hero">
          <h1 className="auth-left-title">Te invitaron<br />al carrete.</h1>
          <p className="auth-left-sub">Fotos en alta calidad, con el EXIF intacto, solo para la gente de adentro.</p>
        </div>
        <div className="auth-left-caption">● INVITACION {code}</div>
      </div>

      <div className="auth-right">
        <form className="auth-form" onSubmit={submit}>
          <div className="mobile-auth-logo">
            <div className="logo-sq" />
            <span className="logo-txt">Iris</span>
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>Crear tu cuenta</h1>
          <p style={{ fontSize: 13, color: 'var(--dim)', margin: '0 0 22px', fontFamily: 'var(--mono)' }}>
            Invitacion {code}
          </p>

          <label className="form-label" htmlFor="join-name">Nombre</label>
          <input id="join-name" className="form-input" style={{ marginBottom: 16 }} value={name}
            onChange={e => setName(e.target.value)} placeholder="Cómo te ven tus amigos" maxLength={60} required />

          <label className="form-label" htmlFor="join-email">Email</label>
          <input id="join-email" className="form-input" style={{ marginBottom: 16 }} type="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="vos@email.com" required />

          <label className="form-label" htmlFor="join-pass">Contraseña</label>
          <input id="join-pass" className="form-input" style={{ marginBottom: 20 }} type="password" value={pass}
            onChange={e => setPass(e.target.value)} placeholder="Mínimo 8 caracteres" minLength={8} required />

          {error && <p role="alert" style={{ color: '#f87171', fontSize: 13, marginBottom: 14, fontFamily: 'var(--mono)' }}>{error}</p>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Un momento…' : 'Entrar al carrete'}
          </button>
        </form>
      </div>
    </div>
  )
}
