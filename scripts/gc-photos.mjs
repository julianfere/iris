#!/usr/bin/env node
/**
 * Barrido de archivos huerfanos en PHOTOS_DIR.
 *
 * Existe porque hasta la fase 2 el unlink del temporal vivia en el camino
 * feliz del upload: si Sharp fallaba a mitad, el archivo quedaba en disco sin
 * ninguna fila que lo referenciara. En el carrete de desarrollo eran 11
 * archivos y 72 MB, el 72% del directorio.
 *
 * El pipeline nuevo ya no los genera (hay try/finally), pero los viejos hay
 * que barrerlos, y conviene poder auditar el estado cuando algo se cae.
 *
 *   node scripts/gc-photos.mjs           lista, no borra nada
 *   node scripts/gc-photos.mjs --delete  borra de verdad
 */

import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const APPLY = process.argv.includes('--delete')

const rawDb = (process.env.DATABASE_URL ?? 'file:./data/carrete.db').replace(/^file:/, '')
const dbPath = path.isAbsolute(rawDb) ? rawDb : path.join(process.cwd(), rawDb)
const PHOTOS_DIR = process.env.PHOTOS_DIR ?? path.join(process.cwd(), 'photos')
const THUMBS_DIR = path.join(PHOTOS_DIR, '.thumbs')
const AVATARS_DIR = path.join(PHOTOS_DIR, '.avatars')

if (!fs.existsSync(dbPath)) {
  console.error(`No existe la base en ${dbPath}`)
  process.exit(1)
}

const db = new Database(dbPath, { readonly: true })
// display_name la agrega la migracion que corre al arrancar la app, asi que
// el script tiene que poder trabajar sobre una base que todavia no arranco.
const cols = db.prepare('PRAGMA table_info(photos)').all().map(c => c.name)
const hasDisplay = cols.includes('display_name')
const rows = db.prepare(
  `SELECT id, filename${hasDisplay ? ', display_name' : ''} FROM photos`,
).all()
const users = new Set(db.prepare('SELECT id FROM users').all().map(u => u.id))
db.close()

// Todo lo que una fila reclama: original, derivado de display y miniatura.
const referenced = new Set()
const referencedThumbs = new Set()
for (const r of rows) {
  if (r.filename) {
    referenced.add(r.filename)
    referencedThumbs.add(path.parse(r.filename).name + '.webp')
  }
  if (r.display_name) referenced.add(r.display_name)
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile())
    .map(e => e.name)
}

function sweep(label, dir, keep) {
  const orphans = listFiles(dir).filter(name => !keep(name))
  let bytes = 0
  for (const name of orphans) {
    const full = path.join(dir, name)
    bytes += fs.statSync(full).size
    console.log(`  ${APPLY ? 'borrado ' : 'huerfano'}  ${label}/${name}`)
    if (APPLY) fs.unlinkSync(full)
  }
  return { count: orphans.length, bytes }
}

console.log(APPLY ? '=== BARRIDO (borrando) ===' : '=== BARRIDO (simulacion, nada se borra) ===')
console.log(`base:   ${dbPath}`)
console.log(`fotos:  ${PHOTOS_DIR}`)
console.log(`filas:  ${rows.length}\n`)

const results = [
  sweep('photos',  PHOTOS_DIR,  n => referenced.has(n) || n.endsWith('.tmp')),
  sweep('.thumbs', THUMBS_DIR,  n => referencedThumbs.has(n)),
  // Los avatares se llaman <userId>.webp y no viven en la tabla photos.
  sweep('.avatars', AVATARS_DIR, n => users.has(path.parse(n).name)),
]

// Los .tmp son de una escritura atomica en curso o de una que aborto; se
// avisan aparte para no borrar por accidente algo que se esta escribiendo.
const stale = listFiles(PHOTOS_DIR).filter(n => n.endsWith('.tmp'))
if (stale.length) console.log(`\n${stale.length} archivo(s) .tmp presentes (escrituras en curso o abortadas)`)

const count = results.reduce((s, r) => s + r.count, 0)
const bytes = results.reduce((s, r) => s + r.bytes, 0)

console.log(`\n${count} huerfano(s), ${(bytes / 1048576).toFixed(1)} MB`)

// Al reves: filas que apuntan a archivos que no estan.
const missing = rows.filter(r => r.filename && !fs.existsSync(path.join(PHOTOS_DIR, r.filename)))
if (missing.length) {
  console.log(`\nATENCION: ${missing.length} fila(s) apuntan a archivos que no existen:`)
  for (const m of missing) console.log(`  ${m.id}  ->  ${m.filename}`)
}

if (!APPLY && count > 0) console.log('\nCorré con --delete para borrarlos.')
