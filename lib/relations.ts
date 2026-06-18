import { relations } from 'drizzle-orm'
import { users, photos, favorites, tags, photoTags } from './schema'

export const usersRelations = relations(users, ({ many }) => ({
  photos:    many(photos),
  favorites: many(favorites),
}))

export const photosRelations = relations(photos, ({ one, many }) => ({
  user:      one(users,  { fields: [photos.userId],  references: [users.id] }),
  favorites: many(favorites),
}))

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user:  one(users,  { fields: [favorites.userId],  references: [users.id] }),
  photo: one(photos, { fields: [favorites.photoId], references: [photos.id] }),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  photoTags: many(photoTags),
}))

export const photoTagsRelations = relations(photoTags, ({ one }) => ({
  photo: one(photos, { fields: [photoTags.photoId], references: [photos.id] }),
  tag:   one(tags,   { fields: [photoTags.tagId],   references: [tags.id] }),
}))
