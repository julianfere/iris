import { db } from './db'
import { pushSubscriptions } from './schema'
import { eq } from 'drizzle-orm'

type PushPayload = {
  title: string
  body?: string
  url?: string
}

export async function sendPushToAll(payload: PushPayload, excludeUserId?: string) {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) return

  const { default: webPush } = await import('web-push')
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

  const subs = db.select().from(pushSubscriptions).all()
  const targets = excludeUserId ? subs.filter(s => s.userId !== excludeUserId) : subs

  await Promise.allSettled(
    targets.map(sub =>
      webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ ...payload, url: payload.url ?? '/global' }),
      ).catch((err: { statusCode?: number }) => {
        // Remove expired/invalid subscriptions
        if (err.statusCode === 410 || err.statusCode === 404) {
          db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint)).run()
        }
      })
    )
  )
}
