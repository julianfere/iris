import { randomInt } from 'crypto'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { db } from './db'
import { invites, users } from './schema'

/** Sin I, O, 0 ni 1: el codigo se dicta por voz y se tipea a mano. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type InviteCheck =
  | { ok: true }
  | { ok: false; reason: 'unknown' | 'used' | 'expired' }

/**
 * `randomInt` y no `Math.random()`: el codigo es la unica credencial que
 * separa a un desconocido de todo el carrete, asi que tiene que venir del
 * CSPRNG. 8 caracteres sobre 32 simbolos son ~40 bits.
 */
export function generateInviteCode(): string {
  let body = ''
  for (let i = 0; i < 8; i++) body += ALPHABET[randomInt(ALPHABET.length)]
  return `CRT-${body.slice(0, 4)}-${body.slice(4)}`
}

export function normalizeInviteCode(raw: string): string {
  return raw.trim().toUpperCase()
}

/**
 * Un carrete vacio no tiene a quien pedirle una invitacion, asi que la
 * primera alta va sin codigo. A partir del segundo usuario siempre hace falta.
 */
export function isBootstrap(): boolean {
  const row = db.select({ c: sql<number>`COUNT(*)` }).from(users).get()
  return Number(row?.c ?? 0) === 0
}

export function checkInvite(rawCode: string, now = Date.now()): InviteCheck {
  const invite = db.select().from(invites).where(eq(invites.code, normalizeInviteCode(rawCode))).get()
  if (!invite) return { ok: false, reason: 'unknown' }
  if (invite.usedBy) return { ok: false, reason: 'used' }
  if (invite.expiresAt < now) return { ok: false, reason: 'expired' }
  return { ok: true }
}

/**
 * Marca el codigo como usado solo si sigue libre y vigente. El UPDATE
 * condicional es lo que hace atomica la operacion: dos altas simultaneas con
 * el mismo codigo compiten por la misma fila y una sola ve `changes === 1`.
 */
export function redeemInvite(rawCode: string, userId: string, now = Date.now()): boolean {
  const res = db
    .update(invites)
    .set({ usedBy: userId, usedAt: now })
    .where(and(
      eq(invites.code, normalizeInviteCode(rawCode)),
      isNull(invites.usedBy),
      sql`${invites.expiresAt} >= ${now}`,
    ))
    .run()
  return res.changes === 1
}

export function createInvite(createdBy: string, now = Date.now()) {
  const code = generateInviteCode()
  db.insert(invites).values({
    code,
    createdBy,
    expiresAt: now + INVITE_TTL_MS,
    createdAt: now,
  }).run()
  return { code, expiresAt: now + INVITE_TTL_MS }
}

export function listInvites(createdBy: string) {
  return db
    .select({
      code: invites.code,
      usedBy: invites.usedBy,
      usedAt: invites.usedAt,
      expiresAt: invites.expiresAt,
      createdAt: invites.createdAt,
      usedByName: users.name,
    })
    .from(invites)
    .leftJoin(users, eq(invites.usedBy, users.id))
    .where(eq(invites.createdBy, createdBy))
    .orderBy(sql`${invites.createdAt} DESC`)
    .all()
}
