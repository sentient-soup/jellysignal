"use client";

import { useQuery } from "@tanstack/react-query";
import { Music, Clock, Disc } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface MusicDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: number;
  initialData: {
    title: string;
    artistName: string | null;
    posterUrl: string | null;
    year: number | null;
  };
}

interface DeezerTrack {
  id: number;
  title: string;
  duration: number;
  preview: string;
}

interface DeezerAlbumDetails {
  id: number;
  title: string;
  release_date: string;
  nb_tracks: number;
  duration: number;
  artist: { id: number; name: string };
  cover_xl: string;
  cover_big: string;
  tracks?: { data: DeezerTrack[] };
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTotalDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} hr ${m} min`;
  return `${m} min`;
}

export function MusicDetailDialog({
  open,
  onOpenChange,
  requestId,
  initialData,
}: MusicDetailDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["request-details", requestId],
    queryFn: async () => {
      const res = await fetch(`/api/requests/${requestId}/details`);
      if (!res.ok) throw new Error("Failed to fetch details");
      return res.json();
    },
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const details: DeezerAlbumDetails | null = data?.details || null;
  const tracks = details?.tracks?.data || [];
  const coverUrl = details?.cover_xl || details?.cover_big || initialData.posterUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg">
        <DialogTitle className="sr-only">
          {details?.title || initialData.title}
        </DialogTitle>

        {/* Album Header */}
        <div className="p-5 pb-4">
          <div className="flex gap-4">
            {/* Album Art */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={initialData.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Album Info */}
            <div className="flex flex-col justify-center min-w-0">
              <h2 className="text-xl font-bold truncate">
                {details?.title || initialData.title}
              </h2>
              <p className="text-sm text-muted-foreground truncate">
                {details?.artist?.name || initialData.artistName || "Unknown Artist"}
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                {(details?.release_date || initialData.year) && (
                  <span>
                    {details?.release_date
                      ? new Date(details.release_date).getFullYear()
                      : initialData.year}
                  </span>
                )}
                {details?.nb_tracks && (
                  <span className="flex items-center gap-1">
                    <Disc className="h-3 w-3" />
                    {details.nb_tracks} tracks
                  </span>
                )}
                {details?.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTotalDuration(details.duration)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Track Listing */}
        <div className="border-t border-border/50">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-5" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-10" />
                </div>
              ))}
            </div>
          ) : tracks.length > 0 ? (
            <div className="divide-y divide-border/30">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 px-5 py-2.5 hover:bg-accent/30 transition-colors"
                >
                  <span className="text-xs text-muted-foreground w-5 text-right tabular-nums">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm truncate">{track.title}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatDuration(track.duration)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Track listing unavailable
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
