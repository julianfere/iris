'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const IconGrid = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
)
const IconSearch = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/>
  </svg>
)
const IconProfile = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>
  </svg>
)

export default function AppNav() {
  const path = usePathname()

  const isFeed    = path === '/global'
  const isSearch  = path.includes('/search')
  const isProfile = path.includes('/profile')

  return (
    <>
      {/* Mobile: bottom nav */}
      <nav className="bottom-nav">
        <Link href="/global" className={`nav-btn${isFeed ? ' active' : ''}`}>
          <IconGrid /><span>Feed</span>
        </Link>
        <Link href="/global/search" className={`nav-btn${isSearch ? ' active' : ''}`}>
          <IconSearch /><span>Buscar</span>
        </Link>
        <Link href="/profile" className={`nav-btn${isProfile ? ' active' : ''}`}>
          <IconProfile /><span>Perfil</span>
        </Link>
      </nav>

      {/* Desktop: inline nav in header area */}
      <nav className="desktop-nav">
        <Link href="/global" className={`desktop-nav-btn${isFeed ? ' active' : ''}`}>
          Feed
        </Link>
        <Link href="/global/search" className={`desktop-nav-btn${isSearch ? ' active' : ''}`}>
          Buscar
        </Link>
        <Link href="/profile" className={`desktop-nav-btn${isProfile ? ' active' : ''}`}>
          Perfil
        </Link>
      </nav>
    </>
  )
}
