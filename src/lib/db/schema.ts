import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Users table - synced from Jellyfin
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // Jellyfin user ID
  username: text("username").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
});

// Media requests table
export const requests = sqliteTable("requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tmdbId: text("tmdb_id"),
  mediaType: text("media_type", { enum: ["movie", "tv", "music"] }).notNull(),
  title: text("title").notNull(),
  year: integer("year"),
  posterUrl: text("poster_url"),
  backdropUrl: text("backdrop_url"),
  overview: text("overview"),

  // Music-specific fields
  deezerId: text("deezer_id"),
  artistName: text("artist_name"),
  albumName: text("album_name"),
  previewUrl: text("preview_url"),

  requestedBy: text("requested_by").references(() => users.id),
  priority: integer("priority").default(0),
  status: text("status", {
    enum: ["pending", "approved", "acquired", "rejected"]
  }).default("pending"),

  jellyfinId: text("jellyfin_id"),
  jellyfinStatus: text("jellyfin_status", {
    enum: ["missing", "partial", "complete"]
  }).default("missing"),
  statusOverride: text("status_override"),
  jellyfinSeasons: integer("jellyfin_seasons"),
  totalSeasons: integer("total_seasons"),

  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date()),
});

// Votes table - for upvoting requests
export const votes = sqliteTable("votes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  requestId: integer("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date()),
}, (table) => ({
  unqVote: uniqueIndex("vote_request_user_idx").on(table.requestId, table.userId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  requests: many(requests),
  votes: many(votes),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  requestedByUser: one(users, {
    fields: [requests.requestedBy],
    references: [users.id],
  }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  request: one(requests, {
    fields: [votes.requestId],
    references: [requests.id],
  }),
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Request = typeof requests.$inferSelect;
export type NewRequest = typeof requests.$inferInsert;
export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;
