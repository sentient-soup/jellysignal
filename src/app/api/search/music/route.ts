import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { searchDeezerAlbums } from "@/lib/deezer";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchDeezerAlbums(query);

  return NextResponse.json({ results });
}
