import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos, users, tags, photoTags } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { initials, formatBytes } from '@/lib/utils'

export default async function AlbumDetailPage({ params }: { params: Promise<{ name: string }> }) {
  const { name: encodedName } = await params
  const albumName = decodeURIComponent(encodedName)

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const tag = db.select().from(tags).where(eq(tags.name, albumName)).get()
  if (!tag) notFound()

  const rows = db
    .select({
      photo: photos,
      user: { id: users.id, name: users.name, avatarColor: users.avatarColor },
    })
    .from(photoTags)
    .innerJoin(photos, eq(photos.id, photoTags.photoId))
    .leftJoin(users, eq(photos.userId, users.id))
    .where(eq(photoTags.tagId, tag.id))
    .orderBy(desc(photos.takenAt))
    .all()

  return (
    <>
      <header className="app-header">
        <div className="logo-sq" />
        <Link href="/global" style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--dim)', fontFamily: 'var(--font)', fontSize: 13, padding: '6px 2px', textDecoration: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3L5 8l5 5"/></svg>
          Volver
        </Link>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, letterSpacing: '-.02em' }}>{albumName}</span>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 22px calc(100px + env(safe-area-inset-bottom))' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.14em', color: 'var(--dim)', marginBottom: 6 }}>Álbum</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-.02em' }}>{albumName}</h1>
          <div style={{ fontSize: 13, color: 'var(--dim)', marginTop: 4 }}>{rows.length} foto{rows.length !== 1 ? 's' : ''}</div>
        </div>

        {rows.length === 0 ? (
          <p style={{ color: 'var(--dim)' }}>No hay fotos en este álbum.</p>
        ) : (
          <div className="masonry">
            {rows.map(({ photo, user }) => {
              const ar = photo.width && photo.height ? photo.width / photo.height : 3 / 2
              return (
                <Link key={photo.id} href={`/global/photo/${photo.id}`} className="photo-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/photos/${photo.id}/thumb`}
                    alt={photo.title ?? ''}
                    style={{ aspectRatio: ar }}
                    loading="lazy"
                  />
                  <div className="photo-overlay">
                    <div className="orig-badge">● ORIGINAL · {formatBytes(photo.size)}</div>
                  </div>
                  <div className="mobile-meta">
                    <div className="m-av" style={{ background: user?.avatarColor ?? 'var(--s2)' }}>
                      {initials(user?.name ?? '')}
                    </div>
                    <div className="m-info">
                      <div className="m-title">{photo.title}</div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
