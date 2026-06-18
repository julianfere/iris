import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UserAvatar from '@/components/UserAvatar'

export default async function MembersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const allUsers = db.select().from(users).orderBy(users.createdAt).all()

  return (
    <>
      <header className="app-header">
        <div className="logo-sq" />
        <Link href="/global" style={{display:'flex',alignItems:'center',gap:7,color:'var(--dim)',fontFamily:'var(--font)',fontSize:13,padding:'6px 2px',textDecoration:'none'}}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3L5 8l5 5"/></svg>
          Volver
        </Link>
        <span style={{flex:1, fontSize:15, fontWeight:600, letterSpacing:'-.02em'}}>Personas</span>
      </header>

      <div style={{maxWidth:540,margin:'0 auto',padding:'32px 20px 80px'}}>
        <div style={{marginBottom:28}}>
          <div style={{fontFamily:'var(--mono)',fontSize:11,textTransform:'uppercase',letterSpacing:'.14em',color:'var(--dim)',marginBottom:6}}>En el carrete</div>
          <h1 style={{fontSize:22,fontWeight:700,margin:0}}>{allUsers.length} persona{allUsers.length !== 1 ? 's' : ''}</h1>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:2}}>
          {allUsers.map(u => (
            <Link
              key={u.id}
              href={`/profile?userId=${u.id}`}
              style={{display:'flex',alignItems:'center',gap:13,padding:'13px 0',borderBottom:'1px solid var(--line)',textDecoration:'none',color:'inherit'}}
            >
              <UserAvatar
                userId={u.id}
                name={u.name}
                avatarColor={u.avatarColor ?? 'var(--s2)'}
                style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, fontSize: 14 }}
              />
              <div style={{flex:1,minWidth:0}}>
                <span style={{fontSize:14.5,fontWeight:600}}>{u.name}</span>
                {u.bio && <div style={{fontSize:13,color:'var(--dim)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.bio}</div>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
