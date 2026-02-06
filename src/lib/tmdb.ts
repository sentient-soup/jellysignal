// TMDB API client

const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export interface TMDBSearchResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type: "movie" | "tv";
}

export interface TMDBSearchResponse {
  page: number;
  results: TMDBSearchResult[];
  total_pages: number;
  total_results: number;
}

export function getPosterUrl(path: string | null, size: "w200" | "w500" | "original" = "w500"): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: "w780" | "w1280" | "original" = "w1280"): string | null {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export async function searchTMDB(query: string, page = 1): Promise<TMDBSearchResponse> {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY,
    query,
    page: page.toString(),
    include_adult: "false",
  });

  const response = await fetch(`${TMDB_BASE_URL}/search/multi?${params}`);

  if (!response.ok) {
    throw new Error("TMDB search failed");
  }

  const data = await response.json();

  // Filter to only movies and TV shows
  data.results = data.results.filter(
    (item: TMDBSearchResult) => item.media_type === "movie" || item.media_type === "tv"
  );

  return data;
}

export async function getMovieDetails(id: number) {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY,
  });

  const response = await fetch(`${TMDB_BASE_URL}/movie/${id}?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch movie details");
  }

  return response.json();
}

export async function getTVDetails(id: number) {
  const params = new URLSearchParams({
    api_key: TMDB_API_KEY,
  });

  const response = await fetch(`${TMDB_BASE_URL}/tv/${id}?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch TV details");
  }

  return response.json();
}

export function normalizeSearchResult(result: TMDBSearchResult) {
  return {
    tmdbId: result.id.toString(),
    mediaType: result.media_type,
    title: result.title || result.name || "Unknown",
    year: result.release_date
      ? parseInt(result.release_date.split("-")[0])
      : result.first_air_date
      ? parseInt(result.first_air_date.split("-")[0])
      : null,
    overview: result.overview,
    posterUrl: getPosterUrl(result.poster_path),
    backdropUrl: getBackdropUrl(result.backdrop_path),
    rating: result.vote_average,
  };
}
