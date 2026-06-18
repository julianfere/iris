import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos, users, favorites } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'
import { redirect, notFound } from 'next/navigation'
import { formatExposure, relativeDate } from '@/lib/utils'
import PhotoOverlay from '@/components/PhotoOverlay'

export default async function PhotoModal({ params }: { params: Promise<{ photoId: string }> }) {
  const { photoId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const photo = db.select().from(photos).where(eq(photos.id, photoId)).get()
  if (!photo) notFound()

  const photoUser = db.select().from(users).where(eq(users.id, photo.userId)).get()

  const favCount = db.select({ c: sql<number>`COUNT(*)` }).from(favorites).where(eq(favorites.photoId, photoId)).get()?.c ?? 0
  const isFav    = !!db.select({ u: favorites.userId }).from(favorites).where(and(eq(favorites.userId, session.user.id), eq(favorites.photoId, photoId))).get()

  const sortKey = photo.takenAt ?? photo.createdAt
  const prevPhoto = db.select({ id: photos.id })
    .from(photos)
    .where(sql`COALESCE(${photos.takenAt}, ${photos.createdAt}) > ${sortKey}`)
    .orderBy(sql`COALESCE(${photos.takenAt}, ${photos.createdAt}) ASC`)
    .limit(1)
    .get()

  const nextPhoto = db.select({ id: photos.id })
    .from(photos)
    .where(sql`COALESCE(${photos.takenAt}, ${photos.createdAt}) < ${sortKey}`)
    .orderBy(sql`COALESCE(${photos.takenAt}, ${photos.createdAt}) DESC`)
    .limit(1)
    .get()

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
    <PhotoOverlay
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
      downloadable={photo.downloadable !== 0}
      isFav={isFav}
      favCount={Number(favCount)}
      isOwn={photo.userId === session.user.id}
      prevId={prevPhoto?.id ?? null}
      nextId={nextPhoto?.id ?? null}
    />
  )
}
