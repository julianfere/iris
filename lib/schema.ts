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
  filename:     text('filename').notNull(),
  originalName: text('original_name').notNull(),
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

export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint:  text('endpoint').notNull().unique(),
  p256dh:    text('p256dh').notNull(),
  auth:      text('auth').notNull(),
  createdAt: integer('created_at').notNull(),
})
