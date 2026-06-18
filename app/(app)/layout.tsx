import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AppNav from '@/components/AppNavClient'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  return (
    <>
      {children}
      <AppNav />
    </>
  )
}
