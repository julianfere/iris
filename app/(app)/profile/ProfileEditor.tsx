'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { initials } from '@/lib/utils'

const AVATAR_COLORS = [
  'hsl(12,32%,34%)',
  'hsl(210,30%,34%)',
  'hsl(280,26%,36%)',
  'hsl(150,26%,32%)',
  'hsl(330,28%,38%)',
  'hsl(45,30%,36%)',
]

interface Props {
  userId: string
  name: string
  bio: string | null
  avatarColor: string
  hasAvatar: boolean
}

export default function ProfileEditor({ userId, name, bio, avatarColor, hasAvatar }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(name)
  const [editBio, setEditBio] = useState(bio ?? '')
  const [editColor, setEditColor] = useState(avatarColor)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function save() {
    if (!editName.trim()) { setError('El nombre no puede estar vacío'); return }
    setSaving(true); setError('')
    try {
      if (avatarFile) {
        const form = new FormData()
        form.append('avatar', avatarFile)
        const r = await fetch('/api/users/me/avatar', { method: 'POST', body: form })
        if (!r.ok) throw new Error('Error subiendo avatar')
      }
      const r = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, bio: editBio, avatarColor: editColor }),
      })
      if (!r.ok) throw new Error('Error guardando')
      setEditing(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setSaving(false)
    }
  }

  function cancel() {
    setEditing(false)
    setEditName(name); setEditBio(bio ?? ''); setEditColor(avatarColor)
    setAvatarFile(null); setAvatarPreview(null); setError('')
  }

  const avatarSrc = avatarPreview ?? (hasAvatar ? `/api/users/${userId}/avatar` : null)
  const showColorPicker = !avatarFile && !hasAvatar

  if (!editing) {
    return (
      <button className="profile-edit-btn" onClick={() => setEditing(true)}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11.5 2.5l2 2L5 13H3v-2L11.5 2.5z"/>
        </svg>
        Editar perfil
      </button>
    )
  }

  return (
    <div className="profile-editor-overlay">
    <div className="profile-editor">
      <div className="editor-section-title">Editar perfil</div>

      {/* Avatar upload */}
      <label className="avatar-upload-wrap">
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onAvatarPick} />
        <div
          className="profile-av profile-av--lg"
          style={avatarSrc ? { background: 'transparent' } : { background: editColor, color: '#fff' }}
        >
          {avatarSrc
            ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : initials(editName || name)
          }
          <div className="avatar-upload-overlay">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4M7 9l5-5 5 5M4 19h16"/>
            </svg>
          </div>
        </div>
      </label>
      <p className="avatar-hint">Tocá para cambiar foto</p>

      {/* Name */}
      <label className="form-label" style={{ marginTop: 20 }}>Nombre</label>
      <input
        className="form-input"
        value={editName}
        onChange={e => setEditName(e.target.value)}
        maxLength={60}
        placeholder="Tu nombre"
        style={{ marginBottom: 16 }}
      />

      {/* Bio */}
      <label className="form-label">Bio</label>
      <textarea
        className="form-input form-textarea"
        value={editBio}
        onChange={e => setEditBio(e.target.value)}
        maxLength={150}
        placeholder="Algo sobre vos (opcional)"
        rows={3}
        style={{ marginBottom: 4 }}
      />
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--dim)', textAlign: 'right', marginBottom: 20 }}>
        {editBio.length}/150
      </div>

      {/* Color swatches */}
      {showColorPicker && (
        <>
          <label className="form-label">Color de avatar</label>
          <div className="color-swatches">
            {AVATAR_COLORS.map(c => (
              <button
                key={c}
                type="button"
                className={`color-swatch${editColor === c ? ' selected' : ''}`}
                style={{ background: c }}
                onClick={() => setEditColor(c)}
              />
            ))}
          </div>
        </>
      )}

      {error && (
        <p style={{ color: '#f87171', fontSize: 13, fontFamily: 'var(--mono)', marginBottom: 14 }}>{error}</p>
      )}

      <div className="editor-actions">
        <button className="btn-primary" onClick={save} disabled={saving} style={{ flex: 1 }}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button type="button" className="btn-secondary" onClick={cancel}>Cancelar</button>
      </div>
    </div>
    </div>
  )
}
