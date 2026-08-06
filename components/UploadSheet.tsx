'use client'

import Sheet from '@/components/Sheet'
import UploadZone from '@/components/UploadZone'

type Props = {
  existingTags: string[]
  onClose: () => void
}

export default function UploadSheet({ existingTags, onClose }: Props) {
  return (
    <Sheet title="Subir fotos" onClose={onClose}>
      <UploadZone
        existingTags={existingTags}
        onSuccess={onClose}
        compact
      />
    </Sheet>
  )
}
