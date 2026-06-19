import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos, users, favorites } from '@/lib/schema'
import { eq, sql, desc } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { initials } from '@/lib/utils'
import { existsSync } from 'fs'
import { avatarPath } from '@/lib/photos'
import ProfileLogout from './ProfileLogout'
import ProfileEditor from './ProfileEditor'

type CameraEntry = { label: string; count: number; sampleIds: string[] }

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ userId?: string; tab?: string }> }) {
  const { userId: qUserId, tab: rawTab } = await searchParams
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const tab = (rawTab === 'camaras' || rawTab === 'favoritos') ? rawTab : 'fotos'

  const targetId = qUserId ?? session.user.id
  const user = db.select().from(users).where(eq(users.id, targetId)).get()
  if (!user) redirect('/global')

  const userPhotos = db.select().from(photos).where(eq(photos.userId, targetId)).orderBy(desc(photos.createdAt)).all()

  const cameraMap = new Map<string, CameraEntry>()
  for (const p of userPhotos) {
    const e = p.exifData ? JSON.parse(p.exifData) : {}
    const label = [e.Make, e.Model].filter(Boolean).join(' ')
    if (!label) continue
    const entry = cameraMap.get(label)
    if (!entry) cameraMap.set(label, { label, count: 1, sampleIds: [p.id] })
    else { entry.count++; if (entry.sampleIds.length < 4) entry.sampleIds.push(p.id) }
  }
  const cameras = Array.from(cameraMap.values())

  const totalFavs = db.select({ c: sql<number>`COUNT(*)` }).from(favorites).where(eq(favorites.userId, targetId)).get()?.c ?? 0

  const favPhotos = tab === 'favoritos'
    ? db.select({ id: photos.id, title: photos.title })
        .from(favorites)
        .innerJoin(photos, eq(favorites.photoId, photos.id))
        .where(eq(favorites.userId, targetId))
        .orderBy(desc(favorites.createdAt))
        .all()
    : []

  const isMe = targetId === session.user.id
  const hasAvatar = existsSync(avatarPath(targetId))

  const tabBase = qUserId ? `userId=${qUserId}&` : ''

  return (
    <>
      <header className="app-header">
        <div className="logo-sq" />
        <Link href="/groups" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', color: 'var(--txt)' }}>
          <span className="logo-txt">Iris</span>
        </Link>
        <div style={{ flex: 1 }} />
      </header>

      <div className="profile-wrap" style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
        <div className="profile-hero">
          {/* Avatar */}
          <div className="profile-av" style={hasAvatar ? {} : { background: user.avatarColor, color: '#fff' }}>
            {hasAvatar
              ? <img src={`/api/users/${user.id}/avatar`} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials(user.name)
            }
          </div>

          {/* Name + bio */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="profile-name">
              {user.name}
              {isMe && <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--dim)', fontWeight: 400, marginLeft: 8, verticalAlign: 'middle' }}>vos</span>}
            </div>
            <div className="profile-bio">{user.bio ?? 'Miembro de Iris'}</div>
          </div>

          {/* Stats */}
          <div className="profile-stats">
            <div><div className="stat-num">{userPhotos.length}</div><div className="stat-label">fotos</div></div>
            <div><div className="stat-num">{cameras.length}</div><div className="stat-label">cámaras</div></div>
            <div><div className="stat-num">{Number(totalFavs)}</div><div className="stat-label">favoritos</div></div>
          </div>

          {/* Owner actions */}
          {isMe && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <ProfileEditor
                userId={user.id}
                name={user.name}
                bio={user.bio ?? null}
                avatarColor={user.avatarColor}
                hasAvatar={hasAvatar}
              />
              <ProfileLogout />
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="profile-tabs">
          <Link href={`/profile?${tabBase}tab=fotos`} className={`profile-tab${tab === 'fotos' ? ' active' : ''}`}>
            Fotos <span className="profile-tab-count">{userPhotos.length}</span>
          </Link>
          <Link href={`/profile?${tabBase}tab=camaras`} className={`profile-tab${tab === 'camaras' ? ' active' : ''}`}>
            Cámaras <span className="profile-tab-count">{cameras.length}</span>
          </Link>
          <Link href={`/profile?${tabBase}tab=favoritos`} className={`profile-tab${tab === 'favoritos' ? ' active' : ''}`}>
            Favoritos <span className="profile-tab-count">{Number(totalFavs)}</span>
          </Link>
        </div>

        {/* Fotos tab */}
        {tab === 'fotos' && (
          <>
            <div className="profile-grid">
              {userPhotos.map(p => (
                <Link key={p.id} href={`/global/photo/${p.id}`} className="profile-photo-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/photos/${p.id}/thumb`} alt={p.title ?? ''} loading="lazy" />
                </Link>
              ))}
            </div>
            {userPhotos.length === 0 && (
              <p style={{ color: 'var(--dim)', textAlign: 'center', padding: '60px 0' }}>Todavía sin fotos.</p>
            )}
          </>
        )}

        {/* Cámaras tab */}
        {tab === 'camaras' && (
          <div className="cameras-list">
            {cameras.length === 0 && (
              <p style={{ color: 'var(--dim)', textAlign: 'center', padding: '60px 0' }}>Sin datos EXIF de cámara.</p>
            )}
            {cameras.map(cam => (
              <div key={cam.label} className="camera-card">
                <div className="camera-card-info">
                  <div className="camera-card-name">{cam.label}</div>
                  <div className="camera-card-count">{cam.count} foto{cam.count !== 1 ? 's' : ''}</div>
                </div>
                <div className="camera-card-thumbs">
                  {cam.sampleIds.map(id => (
                    <Link key={id} href={`/global/photo/${id}`} className="camera-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/photos/${id}/thumb`} alt="" loading="lazy" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Favoritos tab */}
        {tab === 'favoritos' && (
          <>
            <div className="profile-grid">
              {favPhotos.map(p => (
                <Link key={p.id} href={`/global/photo/${p.id}`} className="profile-photo-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/photos/${p.id}/thumb`} alt={p.title ?? ''} loading="lazy" />
                </Link>
              ))}
            </div>
            {favPhotos.length === 0 && (
              <p style={{ color: 'var(--dim)', textAlign: 'center', padding: '60px 0' }}>
                {isMe ? 'Todavía no marcaste favoritos.' : 'Sin favoritos todavía.'}
              </p>
            )}
          </>
        )}
      </div>
    </>
  )
}
