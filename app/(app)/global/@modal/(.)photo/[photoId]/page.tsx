import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { photos, users, favorites, photoTags, tags } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'
import { redirect, notFound } from 'next/navigation'
import { formatExposure, relativeDate, normalizeCameraName } from '@/lib/utils'
import { parseFilterParams, filterQueryString } from '@/lib/photoFilter'
import { computePhotoNav } from '@/lib/photoNav'
import PhotoOverlay from '@/components/PhotoOverlay'

export default async function PhotoModal({
  params,
  searchParams,
}: {
  params: Promise<{ photoId: string }>
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const { photoId } = await params
  const sp = await searchParams
  const filter = parseFilterParams(sp)
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const photo = db.select().from(photos).where(eq(photos.id, photoId)).get()
  if (!photo) notFound()

  const photoUser = db.select().from(users).where(eq(users.id, photo.userId)).get()

  const favCount = db.select({ c: sql<number>`COUNT(*)` }).from(favorites).where(eq(favorites.photoId, photoId)).get()?.c ?? 0
  const isFav    = !!db.select({ u: favorites.userId }).from(favorites).where(and(eq(favorites.userId, session.user.id), eq(favorites.photoId, photoId))).get()
  const photoTagNames = db.select({ name: tags.name }).from(photoTags).innerJoin(tags, eq(photoTags.tagId, tags.id)).where(eq(photoTags.photoId, photoId)).all().map(r => r.name)

  const nav = computePhotoNav(photoId, filter)
  const navQuery = filterQueryString(filter)

  const exif = photo.exifData ? JSON.parse(photo.exifData) : {}
  const cam  = normalizeCameraName(exif.Make, exif.Model)
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
      <style>{`@media (max-width: 767px) { .photo-sidebar { padding-left: 22px; padding-right: 22px; } }`}</style>
      <PhotoOverlay
      photoId={photoId}
      title={photo.title ?? null}
      album={photo.album ?? null}
      tags={photoTagNames}
      size={photo.size}
      originalSize={photo.originalSize}
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
      shareToken={photo.shareToken ?? null}
      isFav={isFav}
      favCount={Number(favCount)}
      isOwn={photo.userId === session.user.id}
      prevId={nav.prevId}
      nextId={nav.nextId}
      index={nav.index}
      total={nav.total}
      navQuery={navQuery}
    />
    </>
  )
}
