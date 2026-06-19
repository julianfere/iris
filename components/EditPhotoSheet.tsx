'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

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
    setSaving(true)
    try {
      const res = await fetch(`/api/photos/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() || null, tags: selectedTags, downloadable }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      router.refresh()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'flex-end',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100%', maxWidth: 520, margin: '0 auto',
        background: 'var(--surface)', borderRadius: '18px 18px 0 0',
        padding: '24px 20px calc(24px + env(safe-area-inset-bottom))',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Editar publicación</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dim)', padding: 4 }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 3l12 12M15 3L3 15" />
            </svg>
          </button>
        </div>

        {/* Title */}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)' }}>Nombre</span>
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título de la foto"
            style={{
              padding: '10px 12px', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'var(--txt)', fontSize: 14, outline: 'none', width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </label>

        {/* Tags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--dim)' }}>Tags</span>
          <div
            style={{
              display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 10px',
              border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg)',
              minHeight: 42, cursor: 'text',
            }}
            onClick={() => document.getElementById('edit-tag-input')?.focus()}
          >
            {selectedTags.map(t => (
              <span key={t} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'var(--s2)', color: 'var(--txt)', borderRadius: 6,
                padding: '3px 8px', fontSize: 12, fontWeight: 500,
              }}>
                {t}
                <button
                  onClick={() => removeTag(t)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: 'var(--dim)' }}
                >×</button>
              </span>
            ))}
            <input
              id="edit-tag-input"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={onTagKeyDown}
              onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
              placeholder={selectedTags.length === 0 ? 'Escribí un tag y presioná Enter' : ''}
              style={{
                border: 'none', outline: 'none', background: 'transparent',
                color: 'var(--txt)', fontSize: 13, minWidth: 120, flex: 1,
              }}
            />
          </div>
        </div>

        {/* Downloadable toggle */}
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Permitir descarga</div>
            <div style={{ fontSize: 12, color: 'var(--dim)' }}>Otros usuarios pueden descargar el original</div>
          </div>
          <div
            onClick={() => setDownloadable(d => !d)}
            style={{
              width: 44, height: 26, borderRadius: 13, cursor: 'pointer',
              background: downloadable ? 'var(--accent, #4f8ef7)' : 'var(--border)',
              position: 'relative', transition: 'background .2s', flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: 3, left: downloadable ? 21 : 3,
              width: 20, height: 20, borderRadius: '50%',
              background: '#fff', transition: 'left .2s',
              boxShadow: '0 1px 3px rgba(0,0,0,.2)',
            }} />
          </div>
        </label>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px', borderRadius: 12,
              border: '1px solid var(--border)', background: 'var(--bg)',
              color: 'var(--txt)', fontSize: 14, cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              flex: 1, padding: '12px', borderRadius: 12,
              border: 'none', background: 'var(--accent, #4f8ef7)',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? .7 : 1,
            }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
