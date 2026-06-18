'use client'

import { signOut } from 'next-auth/react'

export default function ProfileLogout() {
  return (
    <button className="btn-logout" onClick={() => signOut({ callbackUrl: '/login' })}>
      Cerrar sesión
    </button>
  )
}
