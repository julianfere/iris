import { handlers } from '@/lib/auth'
import { NextRequest } from 'next/server'

function withNoCache(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    const res = await handler(req)
    const headers = new Headers(res.headers)
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    headers.set('Pragma', 'no-cache')
    return new Response(res.body, { status: res.status, headers })
  }
}

export const GET  = withNoCache(handlers.GET)
export const POST = withNoCache(handlers.POST)
