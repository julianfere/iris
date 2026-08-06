'use client'

import { signOut } from 'next-auth/react'
import { useState } from 'react'

export default function ProfileLogout() {
  const [busy, setBusy] = useState(false)

  async function logout() {
    setBusy(true)
    // El service worker cachea las miniaturas (Cache-Control: private) y nada
    // las limpiaba: en un dispositivo compartido, la proxima persona que
    // entrara podia leerlas desde el Cache Storage.
    try {
      const reg = await navigator.serviceWorker?.getRegistration()
      reg?.active?.postMessage({ type: 'PURGE_PRIVATE_CACHE' })
    } catch {
      // Sin service worker no hay nada que purgar.
    }
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <button className="btn-logout" onClick={logout} disabled={busy}>
      {busy ? 'Saliendo…' : 'Cerrar sesión'}
    </button>
  )
}
