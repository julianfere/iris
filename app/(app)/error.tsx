'use client'

import { useEffect } from 'react'
import Link from 'next/link'

/**
 * Sin esto, cualquier fallo del server mostraba la pantalla de error generica
 * de Next en produccion: fondo blanco, texto en ingles y ninguna salida.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app]', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '32px 24px',
      textAlign: 'center', gap: 6,
    }}>
      <div className="logo-sq" style={{ marginBottom: 14 }} />
      <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0 }}>Algo se rompió</h1>
      <p style={{ fontSize: 13.5, color: 'var(--dim)', margin: '0 0 22px', maxWidth: 340, lineHeight: 1.5 }}>
        No pudimos cargar esta pantalla. Tus fotos están intactas.
      </p>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={reset}
          style={{
            padding: '12px 20px', borderRadius: 10, border: 'none',
            background: 'var(--ac)', color: '#fff',
            fontFamily: 'var(--font)', fontSize: 14, cursor: 'pointer',
          }}
        >
          Reintentar
        </button>
        <Link
          href="/global"
          style={{
            padding: '12px 20px', borderRadius: 10,
            background: 'var(--s1)', border: '1px solid var(--line)',
            color: 'var(--txt)', fontSize: 14, textDecoration: 'none',
          }}
        >
          Ir al carrete
        </Link>
      </div>

      {error.digest && (
        <code style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--dim)', marginTop: 20 }}>
          {error.digest}
        </code>
      )}
    </div>
  )
}
