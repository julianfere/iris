import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '32px 24px',
      textAlign: 'center',
    }}>
      <div className="logo-sq" style={{ marginBottom: 14 }} />
      <h1 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 6px' }}>Acá no hay nada</h1>
      <p style={{ fontSize: 13.5, color: 'var(--dim)', margin: '0 0 22px', maxWidth: 320, lineHeight: 1.5 }}>
        Puede que la foto se haya borrado o que el link esté mal.
      </p>
      <Link
        href="/global"
        style={{
          padding: '12px 22px', borderRadius: 10, border: 'none',
          background: 'var(--ac)', color: '#fff', fontSize: 14, textDecoration: 'none',
        }}
      >
        Ir al carrete
      </Link>
    </div>
  )
}
