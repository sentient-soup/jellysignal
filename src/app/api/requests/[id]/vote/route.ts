import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, votes, requests } from "@/lib/db";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const requestId = parseInt(id);

  if (isNaN(requestId)) {
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  }

  try {
    // Check if request exists
    const mediaRequest = await db.query.requests.findFirst({
      where: eq(requests.id, requestId),
    });

    if (!mediaRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // Check if user already voted
    const existingVote = await db.query.votes.findFirst({
      where: and(
        eq(votes.requestId, requestId),
        eq(votes.userId, session.userId)
      ),
    });

    if (existingVote) {
      // Remove vote (toggle off)
      await db
        .delete(votes)
        .where(
          and(eq(votes.requestId, requestId), eq(votes.userId, session.userId))
        );

      return NextResponse.json({ voted: false });
    } else {
      // Add vote
      await db.insert(votes).values({
        requestId,
        userId: session.userId,
      });

      return NextResponse.json({ voted: true });
    }
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "Failed to process vote" },
      { status: 500 }
    );
  }
}
