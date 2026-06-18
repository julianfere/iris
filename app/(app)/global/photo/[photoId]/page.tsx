import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos, users, favorites } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { formatExposure, relativeDate } from '@/lib/utils'
import PhotoSidebar from '@/components/PhotoSidebar'

export default async function PhotoPage({ params }: { params: Promise<{ photoId: string }> }) {
  const { photoId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const photo = db.select().from(photos).where(eq(photos.id, photoId)).get()
  if (!photo) notFound()

  const photoUser = db.select().from(users).where(eq(users.id, photo.userId)).get()

  const favCount = db.select({ c: sql<number>`COUNT(*)` }).from(favorites).where(eq(favorites.photoId, photoId)).get()?.c ?? 0
  const isFav    = !!db.select({ u: favorites.userId }).from(favorites).where(and(eq(favorites.userId, session.user.id), eq(favorites.photoId, photoId))).get()

  const exif = photo.exifData ? JSON.parse(photo.exifData) : {}
  const cam  = [exif.Make, exif.Model].filter(Boolean).join(' ') || '—'
  const lens = exif.LensModel ?? '—'
  const ap   = exif.FNumber ? `f/${exif.FNumber}` : '—'
  const sh   = exif.ExposureTime ? formatExposure(exif.ExposureTime) : '—'
  const iso  = String(exif.ISO ?? exif.ISOSpeedRatings ?? '—')
  const fl   = exif.FocalLength ? `${exif.FocalLength} mm` : '—'
  const dim  = photo.width && photo.height ? `${photo.width} × ${photo.height}` : '—'
  const takenLabel = relativeDate(photo.takenAt ?? photo.createdAt)
  const takenTime  = new Date(photo.takenAt ?? photo.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const waSize = Math.round(100 + (photo.size % (300 * 1024)) / 1024 * 0.3)
  const hasGps = typeof exif.GPSLatitude === 'number' && typeof exif.GPSLongitude === 'number'

  return (
    <>
      <header className="app-header">
        <div className="logo-sq" />
        <span style={{ flex: 1, fontSize: 15, fontWeight: 600, letterSpacing: '-.02em' }}>Iris</span>
        <Link href="/global" style={{ color: 'var(--dim)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 3L4.5 7l4 4"/></svg>
          Volver
        </Link>
      </header>

      <div className="photo-split">
        <div className="photo-img-panel">
          <Link href="/global" className="btn-back">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 3L4.5 7l4 4" /></svg>
            <span className="back-txt">Volver</span>
          </Link>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/photos/${photo.id}/thumb`}
            alt={photo.title ?? ''}
            className="photo-main"
            loading="eager"
          />
        </div>

        <PhotoSidebar
          photoId={photoId}
          title={photo.title ?? null}
          album={photo.album ?? null}
          size={photo.size}
          mimeType={photo.mimeType}
          originalName={photo.originalName}
          userId={photo.userId}
          userName={photoUser?.name ?? ''}
          userAvatarColor={photoUser?.avatarColor ?? 'var(--s2)'}
          cam={cam}
          lens={lens}
          ap={ap}
          sh={sh}
          iso={iso}
          fl={fl}
          dim={dim}
          takenLabel={takenLabel}
          takenTime={takenTime}
          waSize={waSize}
          hasGps={hasGps}
          gpsLat={hasGps ? exif.GPSLatitude : null}
          gpsLon={hasGps ? exif.GPSLongitude : null}
          isFav={isFav}
          favCount={Number(favCount)}
          isOwn={photo.userId === session.user.id}
        />
      </div>
    </>
  )
}
