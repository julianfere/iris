'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sheet from '@/components/Sheet'

type Props = {
  photoId: string
  initialTitle: string | null
  initialTags: string[]
  initialDownloadable: boolean
  onClose: () => void
}

export default function EditPhotoSheet({ photoId, initialTitle, initialTags, initialDownloadable, onClose }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle ?? '')
  const [tagInput, setTagInput] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags)
  const [downloadable, setDownloadable] = useState(initialDownloadable)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const tagInputRef = useRef<HTMLInputElement>(null)

  // Sin autofocus al abrir: en el telefono levantaba el teclado de entrada y
  // tapaba la hoja entera antes de que se llegara a ver.

  function addTag(raw: string) {
    const t = raw.trim().toLowerCase().replace(/\s+/g, '-')
    if (t && !selectedTags.includes(t)) setSelectedTags(prev => [...prev, t])
    setTagInput('')
  }

  function removeTag(t: string) {
    setSelectedTags(prev => prev.filter(x => x !== t))
  }

  function onTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && tagInput === '' && selectedTags.length > 0) {
      setSelectedTags(prev => prev.slice(0, -1))
    }
  }

  async function save() {
    setSaving(true); setError('')
    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || null, tags: selectedTags, downloadable }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
      onClose()
    } catch {
      setError('No se pudo guardar. Probá de nuevo.')
      setSaving(false)
    }
  }

  return (
    <Sheet
      title="Editar publicación"
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button className="sheet-btn sheet-btn--ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button className="sheet-btn sheet-btn--primary" onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label className="sheet-label" htmlFor="edit-title">Nombre</label>
          <input
            id="edit-title"
            className="sheet-field"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título de la foto"
          />
        </div>

        <div>
          <span className="sheet-label">Tags</span>
          <div
            className="sheet-field"
            style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', cursor: 'text', padding: '8px 10px' }}
            onClick={() => tagInputRef.current?.focus()}
          >
            {selectedTags.map(t => (
              <span key={t} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'var(--s2)', color: 'var(--txt)', borderRadius: 6,
                padding: '4px 6px 4px 9px', fontSize: 13, maxWidth: '100%',
              }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t}</span>
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); removeTag(t) }}
                  aria-label={`Quitar ${t}`}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dim)',
                    width: 22, height: 22, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: 0, flexShrink: 0, fontSize: 15,
                  }}
                >×</button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={onTagKeyDown}
              onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
              placeholder={selectedTags.length === 0 ? 'Escribí un tag y presioná Enter' : ''}
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                color: 'var(--txt)', fontFamily: 'var(--font)', fontSize: 16,
                flex: '1 1 110px', minWidth: 0, padding: '4px 0',
              }}
            />
          </div>
        </div>

        {/* sheet-row se apila cuando no entra, en vez de dejar el switch fuera de pantalla */}
        <div className="sheet-row">
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 500 }}>Permitir descarga</div>
            <div style={{ fontSize: 12.5, color: 'var(--dim)', marginTop: 2 }}>
              Otros usuarios pueden descargar el original
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={downloadable}
            aria-label="Permitir descarga"
            className="sheet-switch"
            onClick={() => setDownloadable(d => !d)}
          >
            <span />
          </button>
        </div>

        {error && (
          <p role="alert" style={{ color: '#f87171', fontSize: 13, margin: 0, fontFamily: 'var(--mono)' }}>
            {error}
          </p>
        )}
      </div>
    </Sheet>
  )
}
