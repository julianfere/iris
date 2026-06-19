import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'

// Middleware runs on Edge — only import the Edge-safe config, never lib/db or lib/auth
export default NextAuth(authConfig).auth

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico).*)'],
}
