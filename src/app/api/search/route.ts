import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { searchTMDB, normalizeSearchResult } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const page = parseInt(searchParams.get("page") || "1");

  if (!query) {
    return NextResponse.json({ results: [], total: 0 });
  }

  try {
    const data = await searchTMDB(query, page);

    const results = data.results.map(normalizeSearchResult);

    return NextResponse.json({
      results,
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
