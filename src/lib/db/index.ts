import { drizzle } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import * as schema from "./schema";

let client: Client | null = null;
let database: ReturnType<typeof drizzle<typeof schema>> | null = null;
let initialized = false;

function getClient(): Client {
  if (!client) {
    client = createClient({
      url: process.env.DATABASE_URL || "file:./data/jellysignal.db",
    });
  }
  return client;
}

function ensureTables(c: Client) {
  if (initialized) return;
  initialized = true;
  c.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tmdb_id TEXT,
      media_type TEXT NOT NULL,
      title TEXT NOT NULL,
      year INTEGER,
      poster_url TEXT,
      backdrop_url TEXT,
      overview TEXT,
      requested_by TEXT REFERENCES users(id),
      priority INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      jellyfin_id TEXT,
      jellyfin_status TEXT DEFAULT 'missing',
      created_at INTEGER,
      updated_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_id INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at INTEGER
    );
    CREATE UNIQUE INDEX IF NOT EXISTS vote_request_user_idx ON votes(request_id, user_id);
  `);
}

export function getDb() {
  if (!database) {
    const c = getClient();
    ensureTables(c);
    database = drizzle(c, { schema });
  }
  return database;
}

// Lazy proxy: accessing `db` only connects when a query is actually made
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    const realDb = getDb();
    const value = Reflect.get(realDb, prop, receiver);
    if (typeof value === "function") {
      return value.bind(realDb);
    }
    return value;
  },
});

export * from "./schema";
