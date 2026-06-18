'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  existingAlbums?: string[]
  onSuccess?: () => void
  compact?: boolean
}

export default function UploadZone({ existingAlbums = [], onSuccess, compact }: Props) {
  const router = useRouter()
  const [files, setFiles]     = useState<File[]>([])
  const [album, setAlbum]     = useState('')
  const [title, setTitle]     = useState('')
  const [status, setStatus]   = useState<'idle'|'uploading'|'done'|'error'>('idle')
  const [progress, setProgress] = useState('')

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files ?? []))
    setStatus('idle')
  }

  async function upload() {
    if (!files.length) return
    setStatus('uploading')
    setProgress(`Subiendo ${files.length} foto${files.length !== 1 ? 's' : ''}…`)

    const form = new FormData()
    files.forEach(f => form.append('file', f))
    if (album.trim()) form.append('album', album.trim())
    if (title.trim()) form.append('title', title.trim())

    const res = await fetch('/api/photos/upload', {
      method: 'POST',
      body: form,
    })

    if (res.ok) {
      const data = await res.json()
      setStatus('done')
      setProgress(`✓ ${data.count} foto${data.count !== 1 ? 's' : ''} subida${data.count !== 1 ? 's' : ''}`)
      if (onSuccess) {
        setTimeout(onSuccess, 900)
      } else {
        setTimeout(() => router.push('/global'), 1200)
      }
    } else {
      setStatus('error')
      setProgress('Error al subir. Intentá de nuevo.')
    }
  }

  return (
    <div
      className={compact ? undefined : 'upload-wrap'}
      style={compact
        ? { padding: '16px 20px calc(24px + env(safe-area-inset-bottom))' }
        : { paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }
      }
    >
      {!compact && (
        <>
          <h1 className="page-title">Subir al carrete</h1>
          <p className="upload-sub">
            Tus fotos se guardan tal cual salieron de la cámara. Nada de recompresión: todos las ven y descargan en resolución completa.
          </p>
        </>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        <div>
          {existingAlbums.length > 0 && (
            <datalist id="albums">
              {existingAlbums.map(a => <option key={a} value={a} />)}
            </datalist>
          )}
          <input
            className="form-input"
            type="text"
            placeholder="Álbum (opcional)"
            list={existingAlbums.length > 0 ? 'albums' : undefined}
            value={album}
            onChange={e => setAlbum(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <input
          className="form-input"
          type="text"
          placeholder="Título del batch (opcional)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ width: '100%' }}
        />
      </div>

      <label className="dropzone" style={{ cursor: 'pointer' }}>
        <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onPick} />
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="var(--ac)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16V4M7 9l5-5 5 5M4 19h16" />
        </svg>
        <div className="dropzone-title">
          {files.length
            ? `${files.length} foto${files.length !== 1 ? 's' : ''} elegida${files.length !== 1 ? 's' : ''}`
            : 'Arrastrá tus fotos o tocá para elegir'}
        </div>
        <div className="dropzone-sub">JPEG · RAW · HEIC · PNG — se sube el original sin tocar</div>
      </label>

      {files.length > 0 && status !== 'done' && (
        <button
          className="btn-primary"
          style={{ marginTop: 16 }}
          onClick={upload}
          disabled={status === 'uploading'}
        >
          {status === 'uploading' ? progress : `Subir ${files.length} foto${files.length !== 1 ? 's' : ''}`}
        </button>
      )}

      {progress && status !== 'uploading' && (
        <p style={{ fontFamily: 'var(--mono)', fontSize: 13, color: status === 'done' ? 'var(--ac)' : '#f87171', marginTop: 14 }}>
          {progress}
        </p>
      )}

      {!compact && (
        <div className="upload-features">
          <div className="upload-feature"><div className="feature-title">Sin compresión</div><div className="feature-desc">Cada bit del archivo original se conserva.</div></div>
          <div className="upload-feature"><div className="feature-title">Metadata intacta</div><div className="feature-desc">Cámara, EXIF y GPS se leen y se muestran.</div></div>
          <div className="upload-feature"><div className="feature-title">Solo tu gente</div><div className="feature-desc">Visible nada más para quienes tienen el link.</div></div>
        </div>
      )}
    </div>
  )
}
