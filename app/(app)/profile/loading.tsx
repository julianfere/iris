import GridSkeleton from '@/components/GridSkeleton'

export default function ProfileLoading() {
  return (
    <>
      <header className="app-header">
        <div className="logo-sq" />
        <span className="logo-txt">Iris</span>
        <div style={{ flex: 1 }} />
      </header>
      <div className="profile-wrap">
        <span className="sr-only" role="status">Cargando el perfil…</span>
        <div className="profile-hero">
          <div className="profile-av skeleton-block" style={{ margin: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="skeleton-line" style={{ height: 20, width: '45%', marginBottom: 8 }} />
            <div className="skeleton-line" style={{ height: 13, width: '70%' }} />
          </div>
        </div>
        <GridSkeleton count={6} />
      </div>
    </>
  )
}
