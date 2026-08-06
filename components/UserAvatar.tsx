'use client'

import { useEffect, useRef, useState } from 'react'
import { initials } from '@/lib/utils'

type Props = {
  userId: string | null
  name: string
  avatarColor: string
  /**
   * Si el server ya sabe que no hay archivo, no se monta el <img> y se evita
   * un 404 por avatar. La pagina de Personas hacia uno por miembro en cada
   * render. `undefined` = no se sabe, se intenta.
   */
  hasAvatar?: boolean
  className?: string
  style?: React.CSSProperties
}

/**
 * Unica implementacion de "avatar con fallback a iniciales". Antes habia tres
 * copias y solo dos eran correctas: PhotoCard renderizaba el <img> visible y
 * lo ocultaba en onError, asi que todo usuario sin avatar producia un
 * parpadeo de imagen rota en cada tarjeta del feed.
 */
export default function UserAvatar({ userId, name, avatarColor, hasAvatar, className, style }: Props) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Si la imagen salio de la cache del navegador, onLoad ya paso antes de que
  // React montara el handler.
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true)
  }, [userId])

  const showImg = userId !== null && hasAvatar !== false && !failed

  return (
    <div
      className={className}
      style={{
        background: avatarColor, color: '#fff',
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 600,
        ...style,
      }}
    >
      {initials(name)}
      {showImg && (
        <img
          ref={imgRef}
          src={`/api/users/${userId}/avatar`}
          alt=""
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', display: loaded ? 'block' : 'none',
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  )
}
