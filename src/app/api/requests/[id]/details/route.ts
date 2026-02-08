import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, requests } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getMovieDetails, getTVDetails } from "@/lib/tmdb";
import { getDeezerAlbumDetails } from "@/lib/deezer";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = parseInt(params.id);
  if (isNaN(requestId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const mediaRequest = await db.query.requests.findFirst({
      where: eq(requests.id, requestId),
    });

    if (!mediaRequest) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (mediaRequest.mediaType === "music") {
      if (!mediaRequest.deezerId) {
        return NextResponse.json({
          type: "music",
          request: mediaRequest,
          details: null,
        });
      }

      const details = await getDeezerAlbumDetails(mediaRequest.deezerId);
      return NextResponse.json({
        type: "music",
        request: mediaRequest,
        details,
      });
    }

    // Movie or TV
    if (!mediaRequest.tmdbId) {
      return NextResponse.json({
        type: mediaRequest.mediaType,
        request: mediaRequest,
        details: null,
      });
    }

    const tmdbId = parseInt(mediaRequest.tmdbId);
    const details = mediaRequest.mediaType === "movie"
      ? await getMovieDetails(tmdbId)
      : await getTVDetails(tmdbId);

    return NextResponse.json({
      type: mediaRequest.mediaType,
      request: mediaRequest,
      details,
    });
  } catch (error) {
    console.error("Error fetching details:", error);
    return NextResponse.json(
      { error: "Failed to fetch details" },
      { status: 500 }
    );
  }
}
