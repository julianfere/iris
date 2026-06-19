import type { NextAuthConfig } from 'next-auth'

// Edge-compatible config — no DB, no fs, no bcrypt.
// Used by middleware to validate JWT sessions without touching Node.js APIs.
export const authConfig = {
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = nextUrl

      const publicPaths = ['/login', '/join', '/api/users', '/api/auth', '/api/health']
      const isPublic = publicPaths.some(p => pathname.startsWith(p))
      const isStatic  = pathname.startsWith('/_next') || pathname.startsWith('/icons') || pathname === '/manifest.json' || pathname === '/sw.js' || pathname === '/favicon.ico'

      if (isStatic) return true
      // Redirect logged-in users away from auth pages (prevents session hijack via shared browser)
      if (isPublic && isLoggedIn && (pathname === '/login' || pathname.startsWith('/join'))) {
        return Response.redirect(new URL('/global', nextUrl))
      }
      if (isPublic) return true
      if (!isLoggedIn) return Response.redirect(new URL('/login', nextUrl))
      return true
    },
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
  providers: [], // filled in auth.ts with the Credentials provider (needs bcrypt + DB)
} satisfies NextAuthConfig
