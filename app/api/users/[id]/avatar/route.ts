import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { existsSync, createReadStream } from 'fs'
import { Readable } from 'stream'
import { avatarPath } from '@/lib/photos'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const { id } = await params
  const filePath = avatarPath(id)

  if (!existsSync(filePath)) return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })

  const webStream = Readable.toWeb(createReadStream(filePath)) as ReadableStream

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
