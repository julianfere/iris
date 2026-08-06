'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
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

          <h1 style={{fontSize:20,fontWeight:700,margin:'0 0 22px'}}>Entrar</h1>

          <label className="form-label" htmlFor="login-email">Email</label>
          <input id="login-email" className="form-input" style={{marginBottom:16}} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vos@email.com" autoComplete="email" required />

          <label className="form-label" htmlFor="login-pass">Contraseña</label>
          <input id="login-pass" className="form-input" style={{marginBottom:20}} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" autoComplete="current-password" required />

          {error && <p role="alert" style={{color:'#f87171',fontSize:13,marginBottom:14,fontFamily:'var(--mono)'}}>{error}</p>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Un momento…' : 'Entrar'}
          </button>

          <p style={{fontSize:12.5,color:'var(--dim)',marginTop:18,textAlign:'center',lineHeight:1.5}}>
            Iris es por invitación. Si alguien te invitó, entrá con el link que te pasó.
          </p>
        </form>
      </div>
    </div>
  )
}
