"use client";

import { useQuery } from "@tanstack/react-query";
import { Star, Clock, Calendar, User } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { TMDBMovieDetails, TMDBTVDetails, TMDBCastMember } from "@/lib/tmdb";

interface MediaDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: number;
  mediaType: "movie" | "tv";
  initialData: {
    title: string;
    year: number | null;
    posterUrl: string | null;
    overview: string | null;
  };
}

function formatRuntime(minutes: number | null): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function CastMember({ member }: { member: TMDBCastMember }) {
  const profileUrl = member.profile_path
    ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
    : null;

  return (
    <div className="flex flex-col items-center gap-1.5 min-w-[80px] max-w-[80px]">
      <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
        {profileUrl ? (
          <img
            src={profileUrl}
            alt={member.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="text-center">
        <p className="text-xs font-medium leading-tight truncate w-full">
          {member.name}
        </p>
        <p className="text-[10px] text-muted-foreground leading-tight truncate w-full">
          {member.character}
        </p>
      </div>
    </div>
  );
}

export function MediaDetailDialog({
  open,
  onOpenChange,
  requestId,
  mediaType,
  initialData,
}: MediaDetailDialogProps) {
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

  const details: TMDBMovieDetails | TMDBTVDetails | null = data?.details || null;
  const isMovie = mediaType === "movie";
  const movieDetails = isMovie ? (details as TMDBMovieDetails | null) : null;
  const tvDetails = !isMovie ? (details as TMDBTVDetails | null) : null;

  const backdropUrl = details?.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`
    : null;

  const title = isMovie
    ? (movieDetails?.title || initialData.title)
    : (tvDetails?.name || initialData.title);

  const cast = details?.credits?.cast?.slice(0, 12) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl">
        <DialogTitle className="sr-only">{title}</DialogTitle>

        {/* Backdrop Hero */}
        <div className="relative w-full h-[200px] sm:h-[250px] overflow-hidden">
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
          <div className="absolute inset-0 backdrop-gradient" />
        </div>

        {/* Content */}
        <div className="px-5 pb-5 -mt-12 relative z-10">
          {/* Title & Meta */}
          <h2 className="text-2xl font-bold mb-1">{title}</h2>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
            {details?.vote_average != null && (
              <span className="flex items-center gap-1" style={{ color: "var(--theme-primary)" }}>
                <Star className="h-4 w-4 fill-current" />
                {details.vote_average.toFixed(1)}
              </span>
            )}
            {isMovie && movieDetails?.release_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {movieDetails.release_date.split("-")[0]}
              </span>
            )}
            {!isMovie && tvDetails?.first_air_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {tvDetails.first_air_date.split("-")[0]}
                {tvDetails.last_air_date && tvDetails.status === "Ended" && (
                  <> – {tvDetails.last_air_date.split("-")[0]}</>
                )}
              </span>
            )}
            {isMovie && movieDetails?.runtime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatRuntime(movieDetails.runtime)}
              </span>
            )}
            {!isMovie && tvDetails && (
              <span>
                {tvDetails.number_of_seasons} season{tvDetails.number_of_seasons !== 1 ? "s" : ""}
                {" · "}
                {tvDetails.number_of_episodes} episodes
              </span>
            )}
          </div>

          {/* Genres */}
          {isLoading ? (
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          ) : details?.genres && details.genres.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {details.genres.map((g) => (
                <Badge key={g.id} variant="secondary" className="text-xs">
                  {g.name}
                </Badge>
              ))}
            </div>
          ) : null}

          {/* Tagline */}
          {details && "tagline" in details && details.tagline && (
            <p className="text-sm italic text-muted-foreground mb-3">
              &ldquo;{details.tagline}&rdquo;
            </p>
          )}

          {/* Overview */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            {details?.overview || initialData.overview || "No description available."}
          </p>

          {/* Created By (TV) */}
          {!isMovie && tvDetails?.created_by && tvDetails.created_by.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted-foreground">
                Created by{" "}
                <span className="text-foreground">
                  {tvDetails.created_by.map((c) => c.name).join(", ")}
                </span>
              </p>
            </div>
          )}

          {/* Cast */}
          {isLoading ? (
            <div>
              <h3 className="text-sm font-semibold mb-3">Cast</h3>
              <div className="flex gap-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-2 w-12" />
                  </div>
                ))}
              </div>
            </div>
          ) : cast.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold mb-3">Cast</h3>
              <div className="cast-scroll">
                {cast.map((member) => (
                  <CastMember key={member.id} member={member} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
