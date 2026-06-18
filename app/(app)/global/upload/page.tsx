import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UploadZone from '@/components/UploadZone'
import Link from 'next/link'

export default async function UploadPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <>
      <header className="app-header">
        <div className="logo-sq" />
        <Link href="/global" style={{display:'flex',alignItems:'center',gap:7,color:'var(--dim)',fontFamily:'var(--font)',fontSize:13,padding:'6px 2px',textDecoration:'none'}}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3L5 8l5 5"/></svg>
          Volver
        </Link>
        <span style={{flex:1, fontSize:15, fontWeight:600, letterSpacing:'-.02em'}}>Subir fotos</span>
      </header>
      <UploadZone />
    </>
  )
}
