import GridSkeleton from '@/components/GridSkeleton'

export default function AlbumLoading() {
  return (
    <>
      <header className="app-header">
        <div className="logo-sq" />
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, letterSpacing: '-.02em' }}>Álbum</span>
      </header>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 22px 100px' }}>
        <span className="sr-only" role="status">Cargando el álbum…</span>
        <div className="skeleton-line" style={{ height: 28, width: 220, marginBottom: 28 }} />
        <GridSkeleton count={8} />
      </div>
    </>
  )
}
