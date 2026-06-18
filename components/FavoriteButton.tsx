'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'

export default function FavoriteButton({
  photoId, initialFav, initialCount,
}: { photoId: string; initialFav: boolean; initialCount: number }) {
  const [isFav, setIsFav] = useState(initialFav)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (loading) return
    setLoading(true)
    const res = await fetch(`/api/photos/${photoId}/favorite`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setIsFav(data.isFav)
      setCount(c => data.isFav ? c + 1 : c - 1)
    }
    setLoading(false)
  }

  return (
    <button className={`btn-fav${isFav?' active':''}`} onClick={toggle}>
      <span style={{fontSize:14}}>{isFav ? '♥' : '♡'}</span>
      <span>{count}</span>
    </button>
  )
}
