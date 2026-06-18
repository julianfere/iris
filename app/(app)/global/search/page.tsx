export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos, users, tags, photoTags } from '@/lib/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { initials } from '@/lib/utils'
import PhotoCard from '@/components/PhotoCard'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const q            = sp.q?.trim() ?? ''
  const activeTag    = sp.tag ?? ''
  const filterUserId = sp.userId ?? ''

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const allTags = db
    .select({ name: tags.name, count: sql<number>`COUNT(${photoTags.photoId})` })
    .from(tags)
    .innerJoin(photoTags, eq(photoTags.tagId, tags.id))
    .groupBy(tags.name)
    .orderBy(sql`COUNT(${photoTags.photoId}) DESC`)
    .all()

  const allUsers = db
    .select({ userId: users.id, user: { name: users.name, avatarColor: users.avatarColor } })
    .from(users)
    .all()

  const hasFilter = q || activeTag || filterUserId
  let results: { photo: typeof photos.$inferSelect; user: { id: string; name: string; avatarColor: string } | null }[] = []

  if (hasFilter) {
    const conditions: ReturnType<typeof eq>[] = []

    if (filterUserId) conditions.push(eq(photos.userId, filterUserId) as ReturnType<typeof eq>)

    if (q) conditions.push(sql`LOWER(${photos.title}) LIKE LOWER(${'%' + q + '%'})` as ReturnType<typeof eq>)

    if (activeTag) {
      conditions.push(
        sql`${photos.id} IN (
          SELECT pt.photo_id FROM photo_tags pt
          INNER JOIN tags t ON pt.tag_id = t.id
          WHERE t.name = ${activeTag}
        )` as ReturnType<typeof eq>
      )
    }

    results = db
      .select({
        photo: photos,
        user: { id: users.id, name: users.name, avatarColor: users.avatarColor },
      })
      .from(photos)
      .leftJoin(users, eq(photos.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(photos.createdAt))
      .all()
  }

  const filterUserName = filterUserId
    ? allUsers.find(m => m.userId === filterUserId)?.user?.name ?? null
    : null

  const clearUrl = (keep: Record<string, string>) => {
    const p = new URLSearchParams(keep)
    return `/global/search${p.toString() ? '?' + p.toString() : ''}`
  }

  return (
    <>
      <header className="app-header">
        <div className="logo-sq" />
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, letterSpacing: '-.02em' }}>Iris</span>
        <Link href="/profile" className="avatar" style={{ width: 32, height: 32, background: allUsers.find(m => m.userId === session.user.id)?.user?.avatarColor ?? 'var(--s2)' }}>
          {initials(session.user.name ?? '')}
        </Link>
      </header>

      <main style={{ paddingBottom: 'calc(86px + env(safe-area-inset-bottom))' }}>
        <div className="feed-wrap">

          <form method="GET" action="/global/search" style={{ marginBottom: 24 }}>
            {activeTag && <input type="hidden" name="tag" value={activeTag} />}
            {filterUserId && <input type="hidden" name="userId" value={filterUserId} />}
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>
              </svg>
              <input
                name="q"
                defaultValue={q}
                placeholder="Buscar por título..."
                className="form-input"
                style={{ paddingLeft: 36 }}
              />
            </div>
          </form>

          {hasFilter && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {activeTag && (
                <Link href={clearUrl({ ...(q && { q }), ...(filterUserId && { userId: filterUserId }) })}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'color-mix(in srgb,var(--ac) 14%,transparent)', border: '1px solid color-mix(in srgb,var(--ac) 40%,transparent)', borderRadius: 20, padding: '5px 10px', fontSize: 13, color: 'var(--ac)', textDecoration: 'none' }}>
                  {activeTag}
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9"/></svg>
                </Link>
              )}
              {filterUserName && (
                <Link href={clearUrl({ ...(q && { q }), ...(activeTag && { tag: activeTag }) })}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'color-mix(in srgb,var(--ac) 14%,transparent)', border: '1px solid color-mix(in srgb,var(--ac) 40%,transparent)', borderRadius: 20, padding: '5px 10px', fontSize: 13, color: 'var(--ac)', textDecoration: 'none' }}>
                  {filterUserName}
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9"/></svg>
                </Link>
              )}
              {q && (
                <Link href={clearUrl({ ...(activeTag && { tag: activeTag }), ...(filterUserId && { userId: filterUserId }) })}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--s2)', border: '1px solid var(--line)', borderRadius: 20, padding: '5px 10px', fontSize: 13, color: 'var(--dim)', textDecoration: 'none' }}>
                  &quot;{q}&quot;
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9"/></svg>
                </Link>
              )}
            </div>
          )}

          {allUsers.length > 1 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)', marginBottom: 12 }}>Personas</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {allUsers.map(m => {
                  const isActive = filterUserId === m.userId
                  const href = isActive
                    ? clearUrl({ ...(q && { q }), ...(activeTag && { tag: activeTag }) })
                    : `/global/search?userId=${m.userId}${activeTag ? '&tag=' + encodeURIComponent(activeTag) : ''}${q ? '&q=' + encodeURIComponent(q) : ''}`
                  return (
                    <Link key={m.userId} href={href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: m.user?.avatarColor ?? 'var(--s2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, fontWeight: 600, color: '#fff',
                        outline: isActive ? '2px solid var(--ac)' : 'none',
                        outlineOffset: 2,
                      }}>
                        {initials(m.user?.name ?? '')}
                      </div>
                      <span style={{ fontSize: 11, color: isActive ? 'var(--ac)' : 'var(--dim)', whiteSpace: 'nowrap', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {m.user?.name?.split(' ')[0] ?? ''}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {allTags.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)', marginBottom: 12 }}>Tags</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allTags.map(t => {
                  const isActive = activeTag === t.name
                  const href = isActive
                    ? clearUrl({ ...(q && { q }), ...(filterUserId && { userId: filterUserId }) })
                    : `/global/search?tag=${encodeURIComponent(t.name)}${filterUserId ? '&userId=' + filterUserId : ''}${q ? '&q=' + encodeURIComponent(q) : ''}`
                  return (
                    <Link key={t.name} href={href} style={{
                      display: 'flex', alignItems: 'center', gap: 5, textDecoration: 'none',
                      padding: '6px 12px', borderRadius: 20, fontSize: 13,
                      background: isActive ? 'color-mix(in srgb,var(--ac) 18%,transparent)' : 'var(--s1)',
                      border: `1px solid ${isActive ? 'color-mix(in srgb,var(--ac) 45%,transparent)' : 'var(--line)'}`,
                      color: isActive ? 'var(--ac)' : 'var(--txt)',
                      transition: 'all .15s',
                    }}>
                      {t.name}
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: isActive ? 'var(--ac)' : 'var(--dim)' }}>{t.count}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {hasFilter && (
            <>
              <div style={{ borderTop: '1px solid var(--line)', marginBottom: 20 }} />
              {results.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--dim)', fontSize: 13 }}>
                  Sin resultados.
                </div>
              ) : (
                <div className="masonry">
                  {results.map(({ photo, user }) => {
                    const exif = photo.exifData ? JSON.parse(photo.exifData) : {}
                    const cam  = [exif.Make, exif.Model].filter(Boolean).join(' ') || '—'
                    const fl   = exif.FocalLength ? `${exif.FocalLength} mm` : ''
                    const ar   = photo.width && photo.height ? photo.width / photo.height : 3/2
                    const timeLabel = new Date(photo.takenAt ?? photo.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                    return (
                      <PhotoCard
                        key={photo.id}
                        photoId={photo.id}
                        userId={photo.userId}
                        avatarColor={user?.avatarColor ?? null}
                        userName={user?.name ?? null}
                        title={photo.title ?? null}
                        cam={cam}
                        fl={fl}
                        size={photo.size}
                        aspectRatio={ar}
                        timeLabel={timeLabel}
                        tags={activeTag ? [activeTag] : []}
                      />
                    )
                  })}
                </div>
              )}
            </>
          )}

          {!hasFilter && allTags.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--dim)', fontSize: 13 }}>
              Subí fotos y asignales tags para encontrarlas acá.
            </div>
          )}
        </div>
      </main>
    </>
  )
}
