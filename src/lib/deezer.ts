// Deezer API client - no auth required

const DEEZER_API = "https://api.deezer.com";

interface DeezerAlbum {
  id: number;
  title: string;
  cover_small: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
}

interface DeezerArtist {
  id: number;
  name: string;
  picture_medium?: string;
}

interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  preview: string;
  artist: DeezerArtist;
  album: DeezerAlbum;
}

interface DeezerGenre {
  id: number;
  name: string;
  picture?: string;
}

interface DeezerContributor {
  id: number;
  name: string;
  role: string;
  picture_medium?: string;
}

interface DeezerAlbumFull {
  id: number;
  title: string;
  cover_small: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
  release_date: string;
  genre_id: number;
  genres?: { data: DeezerGenre[] };
  label?: string;
  nb_tracks: number;
  duration: number;
  fans?: number;
  record_type?: string;
  explicit_lyrics?: boolean;
  contributors?: DeezerContributor[];
  artist: DeezerArtist;
  tracks?: { data: DeezerTrack[] };
}

interface DeezerSearchResponse<T> {
  data: T[];
  total: number;
}

export interface MusicSearchResult {
  deezerId: string;
  title: string;
  artistName: string;
  albumName: string;
  coverUrl: string | null;
  year: number | null;
  previewUrl: string | null;
  type: "album";
}

export async function searchDeezerAlbums(query: string): Promise<MusicSearchResult[]> {
  try {
    const res = await fetch(
      `${DEEZER_API}/search/album?q=${encodeURIComponent(query)}&limit=10`
    );

    if (!res.ok) return [];

    const data: DeezerSearchResponse<DeezerAlbumFull> = await res.json();

    return data.data.map((album) => ({
      deezerId: String(album.id),
      title: album.title,
      artistName: album.artist.name,
      albumName: album.title,
      coverUrl: (album.cover_big || album.cover_medium || "").replace(/^http:\/\//, "https://") || null,
      year: album.release_date ? new Date(album.release_date).getFullYear() : null,
      previewUrl: null,
      type: "album" as const,
    }));
  } catch (error) {
    console.error("[JellySignal] Deezer search error:", error);
    return [];
  }
}

export async function getDeezerAlbumDetails(albumId: string): Promise<DeezerAlbumFull | null> {
  try {
    const res = await fetch(`${DEEZER_API}/album/${albumId}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
