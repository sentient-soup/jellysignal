import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db, requests } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const requestId = parseInt(id);

  if (isNaN(requestId)) {
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  }

  try {
    const existing = await db.query.requests.findFirst({
      where: eq(requests.id, requestId),
    });

    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    await db.delete(requests).where(eq(requests.id, requestId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete request" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.isAdmin) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const requestId = parseInt(id);

  if (isNaN(requestId)) {
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { statusOverride } = body;

    if (statusOverride !== "complete" && statusOverride !== null) {
      return NextResponse.json(
        { error: "statusOverride must be \"complete\" or null" },
        { status: 400 }
      );
    }

    const existing = await db.query.requests.findFirst({
      where: eq(requests.id, requestId),
    });

    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    // When setting override to complete, also update jellyfinStatus immediately
    if (statusOverride === "complete") {
      await db
        .update(requests)
        .set({ statusOverride, jellyfinStatus: "complete" })
        .where(eq(requests.id, requestId));
    } else {
      await db
        .update(requests)
        .set({ statusOverride })
        .where(eq(requests.id, requestId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Patch error:", error);
    return NextResponse.json(
      { error: "Failed to update request" },
      { status: 500 }
    );
  }
}
