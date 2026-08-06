import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id:           text('id').primaryKey(),
  name:         text('name').notNull(),
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  avatarColor:  text('avatar_color').notNull().default('hsl(210,30%,34%)'),
  bio:          text('bio'),
  createdAt:    integer('created_at').notNull(),
})

export const photos = sqliteTable('photos', {
  id:           text('id').primaryKey(),
  userId:       text('user_id').notNull().references(() => users.id),
  /** Archivo de mayor calidad en disco. Es lo que sirve /original. */
  filename:     text('filename').notNull(),
  /**
   * 1 si `filename` es el archivo tal cual lo subieron. 0 en las filas
   * anteriores a este cambio, donde el pipeline recomprimia y borraba el
   * original: ahi lo mejor que queda es el WebP.
   */
  hasOriginal:  integer('has_original').notNull().default(0),
  /** Derivado WebP de 2560px que consume el visor. Se genera on-demand. */
  displayName:  text('display_name'),
  displaySize:  integer('display_size'),
  /** SHA-256 del archivo subido: evita guardar dos veces la misma foto. */
  contentHash:  text('content_hash'),
  originalName: text('original_name').notNull(),
  /** Bytes de `filename`. Es lo que se muestra y lo que realmente baja. */
  size:         integer('size').notNull(),
  originalSize: integer('original_size'),
  mimeType:     text('mime_type').notNull(),
  width:        integer('width'),
  height:       integer('height'),
  exifData:     text('exif_data'),
  title:        text('title'),
  album:        text('album'),
  downloadable: integer('downloadable').notNull().default(1),
  shareToken:   text('share_token').unique(),
  takenAt:      integer('taken_at'),
  createdAt:    integer('created_at').notNull(),
})

export const favorites = sqliteTable('favorites', {
  userId:    text('user_id').notNull().references(() => users.id),
  photoId:   text('photo_id').notNull().references(() => photos.id),
  createdAt: integer('created_at').notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.photoId] })])

export const tags = sqliteTable('tags', {
  id:   text('id').primaryKey(),
  name: text('name').notNull(),
})

export const photoTags = sqliteTable('photo_tags', {
  photoId: text('photo_id').notNull().references(() => photos.id, { onDelete: 'cascade' }),
  tagId:   text('tag_id').notNull().references(() => tags.id,     { onDelete: 'cascade' }),
}, (t) => [primaryKey({ columns: [t.photoId, t.tagId] })])

export const invites = sqliteTable('invites', {
  code:      text('code').primaryKey(),
  createdBy: text('created_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  usedBy:    text('used_by').references(() => users.id),
  usedAt:    integer('used_at'),
  expiresAt: integer('expires_at').notNull(),
  createdAt: integer('created_at').notNull(),
})

export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint:  text('endpoint').notNull().unique(),
  p256dh:    text('p256dh').notNull(),
  auth:      text('auth').notNull(),
  createdAt: integer('created_at').notNull(),
})
