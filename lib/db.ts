import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import * as relations from './relations'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs'

const raw = (process.env.DATABASE_URL ?? 'file:./data/carrete.db').replace(/^file:/, '')
const dbPath = path.isAbsolute(raw) ? raw : path.join(process.cwd(), raw)

const dir = path.dirname(dbPath)
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

// Bootstrap tables — no migration tooling needed
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar_color  TEXT NOT NULL DEFAULT 'hsl(210,30%,34%)',
    bio           TEXT,
    created_at    INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS photos (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id),
    filename      TEXT NOT NULL,
    original_name TEXT NOT NULL,
    size          INTEGER NOT NULL,
    mime_type     TEXT NOT NULL,
    width         INTEGER,
    height        INTEGER,
    exif_data     TEXT,
    title         TEXT,
    album         TEXT,
    taken_at      INTEGER,
    created_at    INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS favorites (
    user_id    TEXT NOT NULL REFERENCES users(id),
    photo_id   TEXT NOT NULL REFERENCES photos(id),
    created_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, photo_id)
  );
  CREATE TABLE IF NOT EXISTS tags (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS photo_tags (
    photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    tag_id   TEXT NOT NULL REFERENCES tags(id)   ON DELETE CASCADE,
    PRIMARY KEY (photo_id, tag_id)
  );
`)

// Runtime migrations — safe to run multiple times

// Add bio column if missing (pre-existing installs)
const userCols = sqlite.prepare("PRAGMA table_info(users)").all() as { name: string }[]
if (!userCols.some(c => c.name === 'bio')) {
  sqlite.exec('ALTER TABLE users ADD COLUMN bio TEXT')
}

// Remove group_id from photos (pre-groups-removal installs)
const photoCols = sqlite.prepare("PRAGMA table_info(photos)").all() as { name: string }[]
if (photoCols.some(c => c.name === 'group_id')) {
  sqlite.pragma('foreign_keys = OFF')
  sqlite.exec(`
    CREATE TABLE photos_new (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL REFERENCES users(id),
      filename      TEXT NOT NULL,
      original_name TEXT NOT NULL,
      size          INTEGER NOT NULL,
      mime_type     TEXT NOT NULL,
      width         INTEGER,
      height        INTEGER,
      exif_data     TEXT,
      title         TEXT,
      album         TEXT,
      taken_at      INTEGER,
      created_at    INTEGER NOT NULL
    );
    INSERT INTO photos_new
      SELECT id, user_id, filename, original_name, size, mime_type,
             width, height, exif_data, title, album, taken_at, created_at
      FROM photos;
    DROP TABLE photos;
    ALTER TABLE photos_new RENAME TO photos;
  `)
  sqlite.pragma('foreign_keys = ON')
}

// Remove group_id from tags (pre-groups-removal installs)
const tagCols = sqlite.prepare("PRAGMA table_info(tags)").all() as { name: string }[]
if (tagCols.some(c => c.name === 'group_id')) {
  sqlite.pragma('foreign_keys = OFF')
  sqlite.exec(`
    CREATE TABLE tags_new (
      id   TEXT PRIMARY KEY,
      name TEXT NOT NULL
    );
    INSERT INTO tags_new SELECT id, name FROM tags;
    DROP TABLE tags;
    ALTER TABLE tags_new RENAME TO tags;
  `)
  sqlite.pragma('foreign_keys = ON')
}

// Drop group tables (no longer needed)
sqlite.exec(`
  DROP TABLE IF EXISTS group_members;
  DROP TABLE IF EXISTS groups;
`)

// Migrate photos.album → tags/photo_tags (one-time, idempotent)
const photoTagCount = (sqlite.prepare('SELECT COUNT(*) as c FROM photo_tags').get() as { c: number }).c
if (photoTagCount === 0) {
  const photosWithAlbum = sqlite.prepare(
    "SELECT id, album FROM photos WHERE album IS NOT NULL AND album != ''"
  ).all() as { id: string; album: string }[]

  if (photosWithAlbum.length > 0) {
    const tagCache  = new Map<string, string>()
    const insertTag = sqlite.prepare('INSERT OR IGNORE INTO tags (id, name) VALUES (?, ?)')
    const findTag   = sqlite.prepare('SELECT id FROM tags WHERE name = ?')
    const insertPT  = sqlite.prepare('INSERT OR IGNORE INTO photo_tags (photo_id, tag_id) VALUES (?, ?)')

    sqlite.transaction(() => {
      for (const p of photosWithAlbum) {
        let tagId = tagCache.get(p.album)
        if (!tagId) {
          insertTag.run(randomUUID(), p.album)
          tagId = (findTag.get(p.album) as { id: string }).id
          tagCache.set(p.album, tagId)
        }
        insertPT.run(p.id, tagId)
      }
    })()
  }
}

export const db = drizzle(sqlite, { schema: { ...schema, ...relations }, logger: false })
