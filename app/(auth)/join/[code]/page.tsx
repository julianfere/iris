import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { checkInvite, normalizeInviteCode } from '@/lib/invites'
import JoinForm from './JoinForm'

const REASON_COPY: Record<string, { title: string; detail: string }> = {
  unknown: { title: 'Codigo invalido',  detail: 'Ese codigo no existe. Revisá que esté bien escrito o pedí uno nuevo.' },
  used:    { title: 'Codigo ya usado',  detail: 'Alguien ya entró con ese codigo. Pedile otro a quien te invitó.' },
  expired: { title: 'Codigo vencido',   detail: 'Las invitaciones duran 7 días. Pedile una nueva a quien te invitó.' },
}

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const session = await auth()
  if (session?.user) redirect('/global')

  const { code } = await params
  const normalized = normalizeInviteCode(decodeURIComponent(code))
  const check = checkInvite(normalized)

  if (!check.ok) {
    const copy = REASON_COPY[check.reason]
    return (
      <div className="auth-split">
        <div className="auth-right">
          <div className="auth-form">
            <div className="mobile-auth-logo">
              <div className="logo-sq" />
              <span className="logo-txt">Iris</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>{copy.title}</h1>
            <p style={{ fontSize: 14, color: 'var(--dim)', margin: '0 0 24px', lineHeight: 1.5 }}>{copy.detail}</p>
            <Link href="/login" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
              Ir a entrar
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return <JoinForm code={normalized} />
}
