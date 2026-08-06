import GridSkeleton from '@/components/GridSkeleton'

export default function FeedLoading() {
  return (
    <>
      <header className="app-header">
        <div className="logo-sq" />
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, letterSpacing: '-.02em' }}>Iris</span>
      </header>
      <main style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
        <div className="feed-wrap">
          <span className="sr-only" role="status">Cargando el carrete…</span>
          <GridSkeleton count={9} />
        </div>
      </main>
    </>
  )
}
