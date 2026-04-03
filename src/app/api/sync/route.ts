import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, requests } from "@/lib/db";
import { searchJellyfinLibrary, searchJellyfinMusic } from "@/lib/jellyfin";
import { eq } from "drizzle-orm";

export async function POST() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  try {
    // Get all pending requests
    const allRequests = await db.query.requests.findMany();

    let updated = 0;

    for (const request of allRequests) {
      // Respect admin overrides — skip library check
      if (request.statusOverride === "complete") {
        if (request.jellyfinStatus !== "complete") {
          await db
            .update(requests)
            .set({ jellyfinStatus: "complete" })
            .where(eq(requests.id, request.id));
          updated++;
        }
        continue;
      }

      if (request.mediaType === "music") {
        if (!request.artistName || !request.albumName) continue;
        const result = await searchJellyfinMusic(request.artistName, request.albumName);

        if (result.status !== request.jellyfinStatus) {
          await db
            .update(requests)
            .set({
              jellyfinStatus: result.status,
              jellyfinId: result.item?.Id || null,
            })
            .where(eq(requests.id, request.id));
          updated++;
        }
      } else {
        if (!request.tmdbId) continue;
        const result = await searchJellyfinLibrary(
          request.tmdbId,
          request.mediaType as "movie" | "tv"
        );

        if (
          result.status !== request.jellyfinStatus ||
          result.jellyfinSeasons !== (request.jellyfinSeasons ?? undefined) ||
          result.totalSeasons !== (request.totalSeasons ?? undefined)
        ) {
          await db
            .update(requests)
            .set({
              jellyfinStatus: result.status,
              jellyfinId: result.item?.Id || null,
              jellyfinSeasons: result.jellyfinSeasons ?? null,
              totalSeasons: result.totalSeasons ?? null,
            })
            .where(eq(requests.id, request.id));
          updated++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      total: allRequests.length,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}
