import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos, users, favorites } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { initials } from '@/lib/utils'
import { existsSync } from 'fs'
import { avatarPath } from '@/lib/photos'
import ProfileLogout from './ProfileLogout'
import ProfileEditor from './ProfileEditor'

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ userId?: string }> }) {
  const { userId: qUserId } = await searchParams
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const targetId = qUserId ?? session.user.id
  const user = db.select().from(users).where(eq(users.id, targetId)).get()
  if (!user) redirect('/global')

  const userPhotos = db.select().from(photos).where(eq(photos.userId, targetId)).all()
  const cameraSet = new Set(
    userPhotos
      .map(p => { const e = p.exifData ? JSON.parse(p.exifData) : {}; return [e.Make, e.Model].filter(Boolean).join(' ') })
      .filter(Boolean)
  )
  const totalFavs = db.select({ c: sql<number>`COUNT(*)` }).from(favorites).where(eq(favorites.userId, targetId)).get()?.c ?? 0

  const isMe = targetId === session.user.id
  const hasAvatar = existsSync(avatarPath(targetId))

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
            <div><div className="stat-num">{cameraSet.size}</div><div className="stat-label">cámaras</div></div>
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

        {/* Photo grid */}
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
      </div>
    </>
  )
}
