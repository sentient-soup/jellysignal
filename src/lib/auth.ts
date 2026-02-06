import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db, users } from "./db";
import { eq } from "drizzle-orm";

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret";
const secret = new TextEncoder().encode(SESSION_SECRET);

export interface SessionPayload {
  userId: string;
  username: string;
  isAdmin: boolean;
  jellyfinToken: string;
  expiresAt: number;
}

export async function createSession(
  userId: string,
  username: string,
  isAdmin: boolean,
  jellyfinToken: string
): Promise<string> {
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

  const token = await new SignJWT({
    userId,
    username,
    isAdmin,
    jellyfinToken,
    expiresAt,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  // Upsert user in database
  await db
    .insert(users)
    .values({
      id: userId,
      username,
      isAdmin,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        username,
        isAdmin,
      },
    });

  return token;
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}

export async function getCurrentUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
  });

  return user;
}
