'use client'

import { useState } from 'react'
import FeedFAB from '@/components/FeedFAB'
import PhotoGrid, { type PhotoGridItem } from '@/components/PhotoGrid'

export default function FeedInteractive({ items, existingTags }: { items: PhotoGridItem[]; existingTags: string[] }) {
  const [selectMode, setSelectMode] = useState(false)

  return (
    <>
      <PhotoGrid
        items={items}
        emptyMessage="El carrete está vacío. Tocá + para subir la primera foto."
        onSelectModeChange={setSelectMode}
      />
      {!selectMode && <FeedFAB existingTags={existingTags} />}
    </>
  )
}
