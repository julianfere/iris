'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import GroupShareButton from '@/components/GroupShareButton'

type Group = { id: string; name: string; inviteCode: string; memberCount: number; latestPhotoAt: number | null }

export default function GroupsClient({ groups }: { groups: Group[] }) {
  const router = useRouter()
  const [creating, setCreating]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [joinCode, setJoinCode]   = useState('')
  const [error, setError]         = useState('')
  const [newCounts, setNewCounts] = useState<Record<string, boolean>>({})
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 767

  useEffect(() => {
    const counts: Record<string, boolean> = {}
    for (const g of groups) {
      if (!g.latestPhotoAt) continue
      const lastVisit = Number(localStorage.getItem(`lastVisit_${g.id}`) ?? 0)
      counts[g.id] = g.latestPhotoAt > lastVisit
    }
    setNewCounts(counts)
  }, [groups])

  async function createGroup() {
    if (!newName.trim()) return
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    const data = await res.json()
    if (res.ok) router.push(`/${data.id}`)
    else setError(data.error)
  }

  async function joinGroup() {
    if (!joinCode.trim()) return
    const res = await fetch('/api/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: joinCode }),
    })
    const data = await res.json()
    if (res.ok) router.push(`/${data.id}`)
    else setError('Código inválido')
  }

  const imgSrc = (seed: string, size: number) =>
    `https://picsum.photos/seed/${seed}/${size}/${size}`

  return (
    <>
      <header className="app-header">
        <div className="logo-sq" />
        <span className="logo-txt">Iris</span>
        <div style={{flex:1}} />
        <button onClick={()=>signOut({callbackUrl:'/login'})} style={{background:'none',border:'none',color:'var(--dim)',cursor:'pointer',fontFamily:'var(--font)',fontSize:13}}>
          Cerrar sesión
        </button>
      </header>

      <div className="groups-main">
        <h1 className="groups-title">Elegí un carrete</h1>
        <p className="groups-sub">Entrá a un grupo donde ya estás, o armá uno nuevo e invitá a tu gente.</p>

        <div className="groups-grid">
          {groups.map(g => (
            <div key={g.id} className="group-card" onClick={()=>router.push(`/${g.id}`)}>
              {isMobile ? (
                <div className="group-card-inner">
                  <img className="group-card-cover" src={imgSrc(g.id, 200)} alt={g.name} loading="lazy" />
                  <div className="group-card-body">
                    <div className="group-card-name" style={{display:'flex',alignItems:'center',gap:7}}>
                      {g.name}
                      {newCounts[g.id] && <span style={{width:8,height:8,borderRadius:'50%',background:'var(--ac)',flexShrink:0,display:'inline-block'}} />}
                    </div>
                    <div className="group-card-meta">
                      <span>{g.memberCount} miembro{g.memberCount!==1?'s':''}</span>
                    </div>
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    <GroupShareButton groupName={g.name} inviteCode={g.inviteCode} />
                  </div>
                </div>
              ) : (
                <>
                  <img className="group-card-cover" src={imgSrc(g.id, 400)} alt={g.name} loading="lazy" style={{aspectRatio:'16/9'}} />
                  <div className="group-card-body" style={{display:'flex',alignItems:'center'}}>
                    <div style={{flex:1}}>
                      <div className="group-card-name" style={{display:'flex',alignItems:'center',gap:7}}>
                        {g.name}
                        {newCounts[g.id] && <span style={{width:8,height:8,borderRadius:'50%',background:'var(--ac)',flexShrink:0,display:'inline-block'}} />}
                      </div>
                      <div className="group-card-meta">
                        <span>{g.memberCount} miembro{g.memberCount!==1?'s':''}</span>
                      </div>
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      <GroupShareButton groupName={g.name} inviteCode={g.inviteCode} />
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}

          {!creating ? (
            <button className="btn-new-group" onClick={()=>setCreating(true)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              <span>Crear grupo</span>
            </button>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:10,padding:16,border:'1px solid var(--line)',borderRadius:12,background:'var(--s1)'}}>
              <input className="form-input" placeholder="Nombre del carrete" value={newName} onChange={e=>setNewName(e.target.value)} style={{background:'var(--bg)'}} />
              <button className="btn-primary" onClick={createGroup}>Crear y entrar</button>
            </div>
          )}
        </div>

        {error && <p style={{color:'#f87171',fontSize:13,fontFamily:'var(--mono)',marginTop:12}}>{error}</p>}

        <div className="join-section">
          <h3>¿Te pasaron un código?</h3>
          <div className="join-row">
            <input
              className="join-input"
              placeholder="CRT-XXXX"
              value={joinCode}
              onChange={e=>setJoinCode(e.target.value.toUpperCase())}
              maxLength={8}
            />
            <button className="btn-join" onClick={joinGroup}>Unirme</button>
          </div>
        </div>
      </div>
    </>
  )
}
