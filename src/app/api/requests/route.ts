import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, requests, votes, users } from "@/lib/db";
import { eq, desc, sql, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const mediaType = searchParams.get("type");
  const status = searchParams.get("status");

  try {
    // Get requests with vote counts
    const allRequests = await db.query.requests.findMany({
      with: {
        requestedByUser: true,
        votes: true,
      },
      orderBy: [desc(requests.createdAt)],
    });

    // Filter based on query params
    let filtered = allRequests;

    if (mediaType && mediaType !== "all") {
      filtered = filtered.filter((r) => r.mediaType === mediaType);
    }

    if (status && status !== "all") {
      filtered = filtered.filter((r) => r.jellyfinStatus === status);
    }

    // Transform response
    const result = filtered.map((r) => ({
      id: r.id,
      tmdbId: r.tmdbId,
      mediaType: r.mediaType,
      title: r.title,
      year: r.year,
      posterUrl: r.posterUrl,
      backdropUrl: r.backdropUrl,
      overview: r.overview,
      deezerId: r.deezerId,
      artistName: r.artistName,
      albumName: r.albumName,
      previewUrl: r.previewUrl,
      status: r.status,
      jellyfinStatus: r.jellyfinStatus,
      voteCount: r.votes.length,
      hasVoted: r.votes.some((v) => v.userId === session.userId),
      requestedBy: r.requestedByUser?.username || "Unknown",
      createdAt: r.createdAt,
    }));

    // Sort by vote count (descending)
    result.sort((a, b) => b.voteCount - a.voteCount);

    return NextResponse.json({ requests: result });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const {
      tmdbId, mediaType, title, year, posterUrl, backdropUrl, overview,
      deezerId, artistName, albumName, previewUrl,
    } = body;

    if (!mediaType || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate: movie/tv need tmdbId, music needs deezerId
    if (mediaType !== "music" && !tmdbId) {
      return NextResponse.json(
        { error: "Missing tmdbId for movie/tv request" },
        { status: 400 }
      );
    }
    if (mediaType === "music" && !deezerId) {
      return NextResponse.json(
        { error: "Missing deezerId for music request" },
        { status: 400 }
      );
    }

    // Check if request already exists
    const existing = mediaType === "music"
      ? await db.query.requests.findFirst({
          where: and(eq(requests.deezerId, deezerId), eq(requests.mediaType, "music")),
        })
      : await db.query.requests.findFirst({
          where: and(eq(requests.tmdbId, tmdbId), eq(requests.mediaType, mediaType)),
        });

    if (existing) {
      return NextResponse.json(
        { error: "This has already been requested", existingId: existing.id },
        { status: 409 }
      );
    }

    // Create the request
    const [newRequest] = await db
      .insert(requests)
      .values({
        tmdbId: mediaType === "music" ? null : tmdbId,
        mediaType,
        title,
        year,
        posterUrl,
        backdropUrl,
        overview,
        deezerId: mediaType === "music" ? deezerId : null,
        artistName: mediaType === "music" ? artistName : null,
        albumName: mediaType === "music" ? albumName : null,
        previewUrl: mediaType === "music" ? previewUrl : null,
        requestedBy: session.userId,
      })
      .returning();

    // Auto-vote for own request
    await db.insert(votes).values({
      requestId: newRequest.id,
      userId: session.userId,
    });

    return NextResponse.json({ request: newRequest }, { status: 201 });
  } catch (error) {
    console.error("Error creating request:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}
