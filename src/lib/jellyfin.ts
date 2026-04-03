// Jellyfin API client

import { getTVDetails } from "./tmdb";

function getJellyfinUrl() {
  return process.env.JELLYFIN_URL || "http://localhost:8096";
}

function getJellyfinApiKey() {
  return process.env.JELLYFIN_API_KEY || "";
}

interface JellyfinAuthResponse {
  User: {
    Id: string;
    Name: string;
    Policy: {
      IsAdministrator: boolean;
    };
  };
  AccessToken: string;
}

interface JellyfinItem {
  Id: string;
  Name: string;
  Type: string;
  ProductionYear?: number;
  ProviderIds?: {
    Tmdb?: string;
    Imdb?: string;
  };
  SeriesName?: string;
  IndexNumber?: number;
  ParentIndexNumber?: number;
}

interface JellyfinLibraryResponse {
  Items: JellyfinItem[];
  TotalRecordCount: number;
}

export async function authenticateWithJellyfin(
  username: string,
  password: string
): Promise<JellyfinAuthResponse | null> {
  const jellyfinUrl = getJellyfinUrl();
  const url = `${jellyfinUrl}/Users/AuthenticateByName`;
  console.log(`[JellySignal] Authenticating against: ${url}`);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Emby-Authorization": `MediaBrowser Client="JellySignal", Device="Server", DeviceId="jellysignal", Version="1.0.0"`,
      },
      body: JSON.stringify({
        Username: username,
        Pw: password,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[JellySignal] Auth failed: ${response.status} ${response.statusText}`, body);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[JellySignal] Auth connection error:", error);
    return null;
  }
}

export async function validateJellyfinToken(
  userId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const response = await fetch(`${getJellyfinUrl()}/Users/${userId}`, {
      headers: {
        "X-Emby-Token": accessToken,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function getJellyfinLibrary(
  itemTypes: string[] = ["Movie", "Series"]
): Promise<JellyfinItem[]> {
  try {
    const params = new URLSearchParams({
      IncludeItemTypes: itemTypes.join(","),
      Recursive: "true",
      Fields: "ProviderIds,ProductionYear",
      api_key: getJellyfinApiKey(),
    });

    const response = await fetch(`${getJellyfinUrl()}/Items?${params}`);

    if (!response.ok) {
      throw new Error("Failed to fetch library");
    }

    const data: JellyfinLibraryResponse = await response.json();
    return data.Items;
  } catch (error) {
    console.error("Error fetching Jellyfin library:", error);
    return [];
  }
}

async function getJellyfinSeriesSeasons(seriesId: string): Promise<JellyfinItem[]> {
  const params = new URLSearchParams({
    api_key: getJellyfinApiKey(),
  });

  const response = await fetch(`${getJellyfinUrl()}/Shows/${seriesId}/Seasons?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch series seasons");
  }

  const data: JellyfinLibraryResponse = await response.json();
  return data.Items;
}

export interface LibrarySearchResult {
  exists: boolean;
  status: "complete" | "partial" | "missing";
  item?: JellyfinItem;
  jellyfinSeasons?: number;
  totalSeasons?: number;
}

export async function searchJellyfinLibrary(
  tmdbId: string,
  mediaType: "movie" | "tv"
): Promise<LibrarySearchResult> {
  const items = await getJellyfinLibrary(
    mediaType === "movie" ? ["Movie"] : ["Series"]
  );

  const match = items.find((item) => item.ProviderIds?.Tmdb === tmdbId);

  if (!match) {
    return { exists: false, status: "missing" };
  }

  // For movies, if we find it, it's complete
  if (mediaType === "movie") {
    return { exists: true, status: "complete", item: match };
  }

  // For TV shows, compare Jellyfin seasons against TMDB expected count
  try {
    const jellyfinSeasons = await getJellyfinSeriesSeasons(match.Id);

    // Filter out specials and bonus content
    const validSeasons = jellyfinSeasons.filter((s) => {
      if (s.IndexNumber === 0 || s.IndexNumber == null) return false;
      const name = (s.Name || "").toLowerCase();
      if (name.includes("extras") || name.includes("bonus") || name.includes("behind the scenes") || name.includes("specials")) return false;
      return true;
    });

    const tmdbDetails = await getTVDetails(parseInt(tmdbId));
    const expectedSeasons = tmdbDetails.number_of_seasons;

    const status = validSeasons.length >= expectedSeasons ? "complete" : "partial";
    return { exists: true, status, item: match, jellyfinSeasons: validSeasons.length, totalSeasons: expectedSeasons };
  } catch (error) {
    console.error("[JellySignal] Error checking TV seasons, falling back to partial:", error);
    return { exists: true, status: "partial", item: match };
  }
}

export async function searchJellyfinMusic(
  artistName: string,
  albumName: string
): Promise<{ exists: boolean; status: "complete" | "partial" | "missing"; item?: JellyfinItem }> {
  try {
    const params = new URLSearchParams({
      IncludeItemTypes: "MusicAlbum",
      Artists: artistName,
      SearchTerm: albumName,
      Recursive: "true",
      Fields: "ProviderIds,Artists",
      api_key: getJellyfinApiKey(),
    });

    const response = await fetch(`${getJellyfinUrl()}/Items?${params}`);

    if (!response.ok) {
      return { exists: false, status: "missing" };
    }

    const data: JellyfinLibraryResponse = await response.json();

    const match = data.Items.find(
      (item) => item.Name.toLowerCase() === albumName.toLowerCase()
    );

    if (!match) {
      return { exists: false, status: "missing" };
    }

    return { exists: true, status: "complete", item: match };
  } catch (error) {
    console.error("[JellySignal] Jellyfin music search error:", error);
    return { exists: false, status: "missing" };
  }
}
