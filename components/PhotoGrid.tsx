'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PhotoCard from '@/components/PhotoCard'

export type PhotoGridItem = {
  photoId: string
  userId: string | null
  avatarColor: string | null
  userName: string | null
  title: string | null
  cam: string
  fl: string
  size: number
  originalSize?: number | null
  aspectRatio: number
  timeLabel: string
  tags: string[]
  isOwn: boolean
  /** When set, consecutive items sharing a label are rendered under one date header (feed view). */
  groupLabel?: string
}

export default function PhotoGrid({
  items,
  ctxQuery,
  emptyMessage,
  onSelectModeChange,
}: {
  items: PhotoGridItem[]
  ctxQuery?: string
  emptyMessage?: string
  onSelectModeChange?: (active: boolean) => void
}) {
  const router = useRouter()
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => { onSelectModeChange?.(selectMode) }, [selectMode, onSelectModeChange])

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function cancelSelection() {
    setSelectMode(false)
    setSelected(new Set())
  }

  const selectedItems = items.filter(i => selected.has(i.photoId))
  const allSelectedOwn = selectedItems.length > 0 && selectedItems.every(i => i.isOwn)

  function downloadSelected() {
    const ids = [...selected]
    const url = `/api/photos/zip?ids=${ids.map(encodeURIComponent).join(',')}`
    const a = document.createElement('a')
    a.href = url
    a.download = 'carrete.zip'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  async function deleteSelected() {
    if (!allSelectedOwn) return
    const n = selected.size
    if (!confirm(`¿Eliminar ${n} foto${n !== 1 ? 's' : ''}? No se puede deshacer.`)) return
    setBusy('Eliminando…')
    try {
      await Promise.all([...selected].map(id => fetch(`/api/photos/${id}`, { method: 'DELETE' })))
    } finally {
      setBusy(null)
      cancelSelection()
      router.refresh()
    }
  }

  if (items.length === 0) {
    return emptyMessage ? (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--dim)', fontSize: 13 }}>{emptyMessage}</div>
    ) : null
  }

  const groups: { label: string | null; items: PhotoGridItem[] }[] = []
  for (const item of items) {
    const label = item.groupLabel ?? null
    const last = groups[groups.length - 1]
    if (last && last.label === label) last.items.push(item)
    else groups.push({ label, items: [item] })
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
        <button
          onClick={() => (selectMode ? cancelSelection() : setSelectMode(true))}
          className="btn-select-toggle"
        >
          {selectMode ? 'Cancelar' : 'Seleccionar'}
        </button>
      </div>

      {groups.map((g, gi) => (
        <div key={gi}>
          {g.label && (
            <div className="date-label">
              <h2>{g.label}</h2>
              <div className="line" />
              <span className="cnt">{g.items.length} foto{g.items.length !== 1 ? 's' : ''}</span>
            </div>
          )}
          <div className="masonry">
            {g.items.map(item => (
              <PhotoCard
                key={item.photoId}
                photoId={item.photoId}
                userId={item.userId}
                avatarColor={item.avatarColor}
                userName={item.userName}
                title={item.title}
                cam={item.cam}
                fl={item.fl}
                size={item.size}
                originalSize={item.originalSize}
                aspectRatio={item.aspectRatio}
                timeLabel={item.timeLabel}
                tags={item.tags}
                href={`/global/photo/${item.photoId}${ctxQuery ? '?' + ctxQuery : ''}`}
                selectMode={selectMode}
                selected={selected.has(item.photoId)}
                onToggleSelect={() => toggle(item.photoId)}
              />
            ))}
          </div>
        </div>
      ))}

      {selectMode && selected.size > 0 && (
        <div className="selection-bar">
          <span className="selection-count">{selected.size} seleccionada{selected.size !== 1 ? 's' : ''}</span>
          <div style={{ flex: 1 }} />
          <button onClick={downloadSelected} disabled={!!busy} className="selection-btn">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v8M5 7l3 3 3-3M3 13.5h10" />
            </svg>
            Descargar
          </button>
          <button
            onClick={deleteSelected}
            disabled={!!busy || !allSelectedOwn}
            title={!allSelectedOwn ? 'Solo podés eliminar tus propias fotos' : undefined}
            className="selection-btn selection-btn--danger"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3.5h10M5.5 3.5V2.5h3v1M5 3.5l.5 8M9 3.5l-.5 8" />
            </svg>
            {busy ?? 'Eliminar'}
          </button>
        </div>
      )}
    </>
  )
}
