export default function SearchLoading() {
  return (
    <>
      <header className="app-header">
        <div className="logo-sq" />
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, letterSpacing: '-.02em' }}>Iris</span>
      </header>
      <main style={{ paddingBottom: 'calc(86px + env(safe-area-inset-bottom))' }}>
        <div className="feed-wrap">
          <div className="search-content">
            <span className="sr-only" role="status">Cargando la búsqueda…</span>
            <div className="skeleton-line" style={{ height: 44, marginBottom: 28, borderRadius: 10 }} />
            <div className="skeleton-line" style={{ height: 11, width: 70, marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="skeleton-line" style={{ width: 44, height: 44, borderRadius: '50%' }} />
              ))}
            </div>
            <div className="skeleton-line" style={{ height: 11, width: 40, marginBottom: 12 }} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[70, 96, 58, 84, 64].map((w, i) => (
                <div key={i} className="skeleton-line" style={{ width: w, height: 30, borderRadius: 20 }} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
