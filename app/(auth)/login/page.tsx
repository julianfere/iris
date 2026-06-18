'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode]     = useState<'login'|'register'>('login')
  const [name, setName]     = useState('')
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (mode === 'register') {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password: pass }),
        })
        if (!res.ok) { setError((await res.json()).error); return }
      }
      const result = await signIn('credentials', { email, password: pass, redirect: false })
      if (result?.error) { setError('Email o contraseña incorrectos'); return }
      router.push('/global')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-split">
      {/* Left panel — desktop only */}
      <div className="auth-left">
        <div className="auth-left-logo">
          <div className="logo-sq" />
          <span className="logo-txt">Iris</span>
        </div>
        <div className="auth-left-hero">
          <h1 className="auth-left-title">Tu carrete,<br/>sin compresión.</h1>
          <p className="auth-left-sub">Compartí fotos en calidad original con tu gente. Sin WhatsApp, sin pérdida.</p>
        </div>
        <div className="auth-left-caption">● ORIGINAL · sin compresión · solo tu gente</div>
        <div className="auth-left-photos">
          <img src="https://picsum.photos/seed/fitzroy09/200/260" alt="" />
          <img src="https://picsum.photos/seed/rooftop6/200/200"  alt="" />
          <img src="https://picsum.photos/seed/cafe12/200/200"    alt="" />
          <img src="https://picsum.photos/seed/wave77/200/150"    alt="" />
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-right">
        <form className="auth-form" onSubmit={submit}>
          <div className="mobile-auth-logo">
            <div className="logo-sq" />
            <span className="logo-txt">Iris</span>
          </div>

          <div className="auth-tabs">
            <button type="button" className={`auth-tab${mode==='login'?' active':''}`}    onClick={()=>setMode('login')}>Entrar</button>
            <button type="button" className={`auth-tab${mode==='register'?' active':''}`} onClick={()=>setMode('register')}>Crear cuenta</button>
          </div>

          {mode === 'register' && (
            <>
              <label className="form-label">Nombre</label>
              <input className="form-input" style={{marginBottom:16}} value={name} onChange={e=>setName(e.target.value)} placeholder="Cómo te ven tus amigos" required />
            </>
          )}

          <label className="form-label">Email</label>
          <input className="form-input" style={{marginBottom:16}} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vos@email.com" required />

          <label className="form-label">Contraseña</label>
          <input className="form-input" style={{marginBottom:20}} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" required />

          {error && <p style={{color:'#f87171',fontSize:13,marginBottom:14,fontFamily:'var(--mono)'}}>{error}</p>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Un momento…' : mode==='login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}
