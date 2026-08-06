export default function MembersLoading() {
  return (
    <>
      <header className="app-header">
        <div className="logo-sq" />
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, letterSpacing: '-.02em' }}>Personas</span>
      </header>
      <div style={{ maxWidth: 540, margin: '0 auto', padding: '32px 20px 80px' }}>
        <span className="sr-only" role="status">Cargando las personas…</span>
        <div className="skeleton-line" style={{ height: 22, width: 140, marginBottom: 28 }} />
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 0', borderBottom: '1px solid var(--line)' }}>
            <div className="skeleton-line" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton-line" style={{ height: 14, width: '40%', marginBottom: 6 }} />
              <div className="skeleton-line" style={{ height: 11, width: '25%' }} />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
