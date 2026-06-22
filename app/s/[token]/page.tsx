import type { Metadata } from 'next'
import { db } from '@/lib/db'
import { photos, users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

type Props = { params: Promise<{ token: string }> }

function absoluteUrl(path: string): string {
  const base = (process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? '').replace(/\/$/, '')
  return base ? `${base}${path}` : path
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const row = db
    .select({ photo: photos, userName: users.name })
    .from(photos)
    .leftJoin(users, eq(photos.userId, users.id))
    .where(eq(photos.shareToken, token))
    .get()

  if (!row) return { title: 'Foto · Iris' }

  const { photo, userName } = row
  const title = photo.title ?? 'Foto sin título'
  const description = userName ? `Foto de ${userName} en Iris` : 'Compartido desde Iris'
  const imageUrl = absoluteUrl(`/api/share/${token}/image`)

  return {
    title: `${title} · Iris`,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl, width: photo.width ?? 1400, height: photo.height ?? 933, alt: title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function SharePage({ params }: Props) {
  const { token } = await params
  const row = db
    .select({ photo: photos, userName: users.name })
    .from(photos)
    .leftJoin(users, eq(photos.userId, users.id))
    .where(eq(photos.shareToken, token))
    .get()

  if (!row) notFound()
  const { photo, userName } = row

  return (
    <main style={{
      minHeight: '100dvh',
      background: '#111',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#e8e8e8',
    }}>
      <div style={{ maxWidth: 720, width: '100%' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/share/${token}/image`}
          alt={photo.title ?? ''}
          style={{ width: '100%', borderRadius: 12, display: 'block' }}
        />
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
          <div>
            {photo.title && (
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-.02em' }}>{photo.title}</h1>
            )}
            {userName && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>por {userName}</p>
            )}
          </div>
          <a
            href="/"
            style={{
              flexShrink: 0, fontSize: 12, color: '#888',
              textDecoration: 'none', borderBottom: '1px solid #444',
              paddingBottom: 1,
            }}
          >
            Abrir Iris
          </a>
        </div>
      </div>
    </main>
  )
}
