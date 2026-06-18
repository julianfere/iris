import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function GroupsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  redirect('/global')
}
