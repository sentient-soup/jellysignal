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

const INIT_SQL = `
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
    deezer_id TEXT,
    artist_name TEXT,
    album_name TEXT,
    preview_url TEXT,
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
`;

// Add music columns to existing databases
const MUSIC_COLUMNS = [
  { name: "deezer_id", type: "TEXT" },
  { name: "artist_name", type: "TEXT" },
  { name: "album_name", type: "TEXT" },
  { name: "preview_url", type: "TEXT" },
];

// Synchronous table creation using native libsql (production/Docker).
// Falls back to async @libsql/client for local dev where native module may not load.
function ensureTables() {
  if (initialized) return;
  initialized = true;

  try {
    const dbUrl = process.env.DATABASE_URL || "file:./data/jellysignal.db";
    const dbPath = dbUrl.replace(/^file:/, "");
    // eslint-disable-next-line
    const NativeDatabase = require("libsql");
    const nativeDb = new NativeDatabase(dbPath);
    nativeDb.exec(INIT_SQL);
    // Migrate existing DBs: add music columns if missing
    for (const col of MUSIC_COLUMNS) {
      try {
        nativeDb.exec(`ALTER TABLE requests ADD COLUMN ${col.name} ${col.type}`);
      } catch {
        // Column already exists, ignore
      }
    }
    nativeDb.close();
    console.log("[JellySignal] Database tables initialized (sync)");
  } catch {
    // Native module unavailable (e.g. Windows dev), use async fallback
    const c = getClient();
    c.executeMultiple(INIT_SQL).then(async () => {
      for (const col of MUSIC_COLUMNS) {
        try {
          await c.execute(`ALTER TABLE requests ADD COLUMN ${col.name} ${col.type}`);
        } catch {
          // Column already exists, ignore
        }
      }
      console.log("[JellySignal] Database tables initialized (async)");
    }).catch((err: unknown) => {
      console.error("[JellySignal] Failed to initialize tables:", err);
    });
  }
}

export function getDb() {
  if (!database) {
    ensureTables();
    database = drizzle(getClient(), { schema });
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
