export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos, users, tags, photoTags } from '@/lib/schema'
import { eq, desc, inArray } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { initials, relativeDate } from '@/lib/utils'
import VisitTracker from '@/components/VisitTracker'
import FeedFAB from '@/components/FeedFAB'
import PhotoCard from '@/components/PhotoCard'

export default async function FeedPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const members = db
    .select({ userId: users.id, user: { avatarColor: users.avatarColor, name: users.name } })
    .from(users)
    .all()

  const rows = db
    .select({
      photo: photos,
      user: { id: users.id, name: users.name, avatarColor: users.avatarColor },
    })
    .from(photos)
    .leftJoin(users, eq(photos.userId, users.id))
    .orderBy(desc(photos.createdAt))
    .all()

  const photoIds = rows.map(r => r.photo.id)
  const tagRows = photoIds.length > 0
    ? db.select({ photoId: photoTags.photoId, name: tags.name })
        .from(photoTags)
        .innerJoin(tags, eq(photoTags.tagId, tags.id))
        .where(inArray(photoTags.photoId, photoIds))
        .all()
    : []

  const tagsByPhoto = tagRows.reduce<Record<string, string[]>>((acc, r) => {
    if (!acc[r.photoId]) acc[r.photoId] = []
    acc[r.photoId].push(r.name)
    return acc
  }, {})

  const existingTags = [...new Set(
    db.select({ name: tags.name }).from(tags).all().map(t => t.name)
  )]

  const byDate: Record<string, typeof rows> = {}
  for (const row of rows) {
    const label = relativeDate(row.photo.createdAt)
    if (!byDate[label]) byDate[label] = []
    byDate[label].push(row)
  }

  const myAvatarColor = members.find(m => m.userId === session.user.id)?.user?.avatarColor ?? 'var(--s2)'

  return (
    <>
      <VisitTracker />
      <header className="app-header">
        <div className="logo-sq" />
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, letterSpacing: '-.02em' }}>Iris</span>
        <div className="members-row" style={{ marginRight: 12 }}>
          {members.slice(0, 5).map(m => (
            <div key={m.userId} className="member-av" style={{ background: m.user?.avatarColor ?? 'var(--s2)', width: 26, height: 26, fontSize: 10 }} title={m.user?.name ?? ''}>
              {initials(m.user?.name ?? '')}
            </div>
          ))}
        </div>
        <a href="/profile" className="avatar" style={{ width: 32, height: 32, background: myAvatarColor }}>
          {initials(session.user.name ?? '')}
        </a>
      </header>

      <main style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
        <div className="feed-wrap">

          {rows.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--dim)' }}>
              <div style={{ fontSize: 13, marginBottom: 8 }}>El carrete está vacío.</div>
              <div style={{ fontSize: 12 }}>Tocá + para subir la primera foto.</div>
            </div>
          )}

          {Object.entries(byDate).map(([label, dateRows]) => (
            <div key={label}>
              <div className="date-label">
                <h2>{label}</h2>
                <div className="line" />
                <span className="cnt">{dateRows.length} foto{dateRows.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="masonry">
                {dateRows.map(({ photo, user }) => {
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
                      tags={tagsByPhoto[photo.id] ?? []}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
      <FeedFAB existingAlbums={existingTags} />
    </>
  )
}
