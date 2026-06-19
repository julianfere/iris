'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatBytes } from '@/lib/utils'

type Props = {
  existingTags?: string[]
  onSuccess?: () => void
  compact?: boolean
}

export default function UploadZone({ existingTags = [], onSuccess, compact }: Props) {
  const router = useRouter()
  const [files, setFiles]               = useState<File[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagInput, setTagInput]         = useState('')
  const [title, setTitle]               = useState('')
  const [downloadable, setDownloadable] = useState(true)
  const [status, setStatus]             = useState<'idle'|'uploading'|'done'|'error'>('idle')
  const [progress, setProgress]         = useState('')
  const [uploadedBytes, setUploadedBytes] = useState(0)
  const [totalBytes, setTotalBytes]       = useState(0)
  const [dragging, setDragging]         = useState(false)
  const inputRef    = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const pct = totalBytes > 0 ? Math.min((uploadedBytes / totalBytes) * 100, 100) : 0
  const isProcessing = status === 'uploading' && pct >= 100

  const suggestions = tagInput.trim()
    ? existingTags.filter(t => !selectedTags.includes(t) && t.includes(tagInput.toLowerCase().trim()))
    : []

  const quickTags = existingTags.filter(t => !selectedTags.includes(t))

  function addTag(raw: string) {
    const clean = raw.trim().toLowerCase().replace(/\s+/g, '-')
    if (!clean || selectedTags.includes(clean)) return
    setSelectedTags(prev => [...prev, clean])
    setTagInput('')
    inputRef.current?.focus()
  }

  function removeTag(tag: string) {
    setSelectedTags(prev => prev.filter(t => t !== tag))
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files ?? []))
    setStatus('idle')
  }

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    if (dragCounter.current === 1) setDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current--
    if (dragCounter.current === 0) setDragging(false)
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (dropped.length) { setFiles(dropped); setStatus('idle') }
  }, [])

  function upload() {
    if (!files.length) return
    const total = files.reduce((s, f) => s + f.size, 0)
    setStatus('uploading')
    setProgress('')
    setUploadedBytes(0)
    setTotalBytes(total)

    const form = new FormData()
    files.forEach(f => form.append('file', f))
    selectedTags.forEach(t => form.append('tag', t))
    if (title.trim()) form.append('title', title.trim())
    form.append('downloadable', downloadable ? '1' : '0')

    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) setUploadedBytes(e.loaded)
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText)
        setStatus('done')
        setProgress(`✓ ${data.count} foto${data.count !== 1 ? 's' : ''} subida${data.count !== 1 ? 's' : ''}`)
        router.refresh()
        if (onSuccess) setTimeout(onSuccess, 900)
        else setTimeout(() => router.push('/global'), 1200)
      } else {
        setStatus('error')
        setProgress('Error al subir. Intentá de nuevo.')
      }
    })

    xhr.addEventListener('error', () => {
      setStatus('error')
      setProgress('Error al subir. Intentá de nuevo.')
    })

    xhr.open('POST', '/api/photos/upload')
    xhr.send(form)
  }

  const totalSize = files.reduce((s, f) => s + f.size, 0)

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

        {/* Tag selector */}
        <div>
          <div
            onClick={() => inputRef.current?.focus()}
            style={{
              border: '1px solid var(--line)', borderRadius: 10,
              padding: '8px 12px', background: 'var(--s1)',
              cursor: 'text', minHeight: 44,
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6,
            }}
          >
            {selectedTags.map(tag => (
              <span key={tag} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'color-mix(in srgb,var(--ac) 14%,transparent)',
                border: '1px solid color-mix(in srgb,var(--ac) 35%,transparent)',
                borderRadius: 20, padding: '2px 6px 2px 9px',
                fontSize: 12, color: 'var(--ac)', lineHeight: 1.6,
              }}>
                {tag}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeTag(tag) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ac)', padding: '0 2px', fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center' }}
                >×</button>
              </span>
            ))}
            <input
              ref={inputRef}
              type="text"
              placeholder={selectedTags.length === 0 ? 'Agregar tag...' : ''}
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) { e.preventDefault(); addTag(tagInput) }
                if (e.key === 'Backspace' && !tagInput && selectedTags.length) removeTag(selectedTags[selectedTags.length - 1])
              }}
              style={{
                border: 'none', background: 'none', outline: 'none',
                fontSize: 14, color: 'var(--txt)', flex: '1 1 80px', minWidth: 80,
                fontFamily: 'var(--font)',
              }}
            />
          </div>

          {/* Typing suggestions */}
          {suggestions.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
              {suggestions.map(t => (
                <button key={t} type="button" onClick={() => addTag(t)} style={{
                  border: '1px solid var(--line)', borderRadius: 20, padding: '3px 10px',
                  fontSize: 12, background: 'var(--s2)', color: 'var(--txt)', cursor: 'pointer',
                }}>
                  {t}
                </button>
              ))}
            </div>
          )}

          {/* Quick-select existing tags */}
          {quickTags.length > 0 && !tagInput && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
              {quickTags.map(t => (
                <button key={t} type="button" onClick={() => addTag(t)} style={{
                  border: '1px solid var(--line)', borderRadius: 20, padding: '3px 10px',
                  fontSize: 12, background: 'var(--s2)', color: 'var(--dim)', cursor: 'pointer',
                }}>
                  + {t}
                </button>
              ))}
            </div>
          )}
        </div>

        <input
          className="form-input"
          type="text"
          placeholder="Título del batch (opcional)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ width: '100%' }}
        />

        {/* Downloadable toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px' }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--txt)' }}>Permitir descargas</div>
            <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 1 }}>Otros usuarios pueden bajar el original</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={downloadable}
            onClick={() => setDownloadable(v => !v)}
            style={{
              width: 44, height: 24, borderRadius: 12,
              border: 'none', flexShrink: 0, cursor: 'pointer',
              background: downloadable ? 'var(--ac)' : 'var(--s2)',
              position: 'relative', transition: 'background .2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 3,
              left: downloadable ? 23 : 3,
              width: 18, height: 18, borderRadius: '50%',
              background: '#fff', transition: 'left .18s',
              boxShadow: '0 1px 3px rgba(0,0,0,.25)',
            }} />
          </button>
        </div>
      </div>

      <label
        className="dropzone"
        style={{
          cursor: 'pointer',
          ...(dragging && {
            borderColor: 'var(--ac)',
            background: 'color-mix(in srgb,var(--ac) 8%,var(--s1))',
          }),
        }}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onPick} />
        <svg
          width="38" height="38" viewBox="0 0 24 24" fill="none"
          stroke="var(--ac)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: dragging ? 'translateY(-4px)' : 'none', transition: 'transform .15s' }}
        >
          <path d="M12 16V4M7 9l5-5 5 5M4 19h16" />
        </svg>
        <div className="dropzone-title">
          {dragging
            ? 'Soltá para agregar'
            : files.length
              ? `${files.length} foto${files.length !== 1 ? 's' : ''} · ${formatBytes(totalSize)}`
              : 'Arrastrá tus fotos o tocá para elegir'}
        </div>
        <div className="dropzone-sub">JPEG · HEIC · PNG · WebP</div>
      </label>

      {/* Upload button */}
      {files.length > 0 && status !== 'done' && status !== 'uploading' && (
        <button
          className="btn-primary"
          style={{ marginTop: 16 }}
          onClick={upload}
        >
          {`Subir ${files.length} foto${files.length !== 1 ? 's' : ''}`}
        </button>
      )}

      {/* Progress indicator */}
      {status === 'uploading' && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--txt)' }}>
              {isProcessing
                ? `Procesando ${files.length} foto${files.length !== 1 ? 's' : ''}…`
                : `Subiendo ${files.length} foto${files.length !== 1 ? 's' : ''}…`}
            </span>
            {!isProcessing && (
              <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--dim)' }}>
                {Math.round(pct)}%
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ height: 4, borderRadius: 2, background: 'var(--s2)', overflow: 'hidden' }}>
            {isProcessing ? (
              <div style={{
                height: '100%', width: '100%', borderRadius: 2,
                background: `linear-gradient(90deg, var(--ac) 25%, color-mix(in srgb,var(--ac) 45%,transparent) 50%, var(--ac) 75%)`,
                backgroundSize: '200% 100%',
                animation: 'progress-sweep 1.4s linear infinite',
              }} />
            ) : (
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: 'var(--ac)',
                borderRadius: 2,
                transition: pct > 0 ? 'width .25s ease' : 'none',
              }} />
            )}
          </div>

          {/* Bytes counter */}
          {!isProcessing && (
            <div style={{ fontSize: 11.5, fontFamily: 'var(--mono)', color: 'var(--dim)', marginTop: 6 }}>
              {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
            </div>
          )}
        </div>
      )}

      {/* Success / error message */}
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
