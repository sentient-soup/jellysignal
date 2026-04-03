"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Film, Tv, ChevronUp, Check, AlertTriangle, Clock, Trash2, Star, User, ShieldCheck, Undo2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Image from "next/image";
import { useState } from "react";

interface RequestCardProps {
  request: {
    id: number;
    tmdbId: string;
    mediaType: string;
    title: string;
    year: number | null;
    posterUrl: string | null;
    overview: string | null;
    jellyfinStatus: string;
    statusOverride: string | null;
    jellyfinSeasons: number | null;
    totalSeasons: number | null;
    voteCount: number;
    hasVoted: boolean;
    requestedBy: string;
  };
  isAdmin?: boolean;
  onVote: (id: number) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  onOverride?: (id: number, statusOverride: "complete" | null) => Promise<void>;
}

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function RequestCard({ request, isAdmin, onVote, onDelete, onOverride }: RequestCardProps) {
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localVoted, setLocalVoted] = useState(request.hasVoted);
  const [localCount, setLocalCount] = useState(request.voteCount);
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["request-details", request.id],
    queryFn: async () => {
      const res = await fetch(`/api/requests/${request.id}/details`);
      if (!res.ok) throw new Error("Failed to fetch details");
      return res.json();
    },
    enabled: expanded,
    staleTime: 5 * 60 * 1000,
  });

  const details = data?.details || null;
  const cast = details?.credits?.cast?.slice(0, 12) || [];

  const handleVote = async () => {
    setVoting(true);
    setLocalVoted(!localVoted);
    setLocalCount(localVoted ? localCount - 1 : localCount + 1);

    try {
      await onVote(request.id);
    } catch {
      setLocalVoted(localVoted);
      setLocalCount(request.voteCount);
    } finally {
      setVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm(`Delete request for "${request.title}"?`)) return;

    setDeleting(true);
    try {
      await onDelete(request.id);
    } finally {
      setDeleting(false);
    }
  };

  const [overriding, setOverriding] = useState(false);

  const handleOverride = async (override: "complete" | null) => {
    if (!onOverride) return;
    setOverriding(true);
    try {
      await onOverride(request.id, override);
    } finally {
      setOverriding(false);
    }
  };

  const statusConfig = {
    complete: { label: request.statusOverride === "complete" ? "In Library (Admin)" : "In Library", icon: request.statusOverride === "complete" ? ShieldCheck : Check, variant: "success" as const },
    partial: { label: "Partial", icon: AlertTriangle, variant: "warning" as const },
    missing: { label: "Requested", icon: Clock, variant: "pending" as const },
  };

  const status = statusConfig[request.jellyfinStatus as keyof typeof statusConfig] || statusConfig.missing;
  const StatusIcon = status.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={!expanded ? { scale: 1.02 } : undefined}
      onClick={() => setExpanded(!expanded)}
      className="group relative glass rounded-xl overflow-hidden border border-border/50 transition-all duration-300 cursor-pointer"
      style={{
        ["--hover-border" as string]: "var(--theme-primary)",
      }}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none theme-gradient-subtle" />

      <div className="relative flex gap-4 p-4">
        {/* Poster */}
        <div className="relative w-20 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {request.posterUrl ? (
            <Image
              src={request.posterUrl}
              alt={request.title}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {request.mediaType === "movie" ? (
                <Film className="h-8 w-8 text-muted-foreground" />
              ) : (
                <Tv className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start gap-2">
              <h3 className="font-semibold text-lg truncate">{request.title}</h3>
              {request.year && (
                <span className="text-muted-foreground flex-shrink-0">
                  ({request.year})
                </span>
              )}
            </div>
            <p className={`text-sm text-muted-foreground mt-1 ${expanded ? "" : "line-clamp-2"}`}>
              {request.overview || "No description available"}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-2">
            {request.jellyfinStatus === "partial" && request.jellyfinSeasons != null && request.totalSeasons != null ? (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant={status.variant} className="gap-1 cursor-help">
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[240px]">
                    <p className="font-medium">{request.jellyfinSeasons} of {request.totalSeasons} season{request.totalSeasons !== 1 ? "s" : ""} available</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {request.totalSeasons - request.jellyfinSeasons} season{request.totalSeasons - request.jellyfinSeasons !== 1 ? "s" : ""} missing from Jellyfin library
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Badge variant={status.variant} className="gap-1">
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              by {request.requestedBy}
            </span>
            {isAdmin && (
              <div className="flex items-center gap-1 ml-auto">
                {onOverride && request.jellyfinStatus === "partial" && request.statusOverride !== "complete" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); handleOverride("complete"); }}
                    disabled={overriding}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-green-500"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                    Mark Complete
                  </Button>
                )}
                {onOverride && request.statusOverride === "complete" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); handleOverride(null); }}
                    disabled={overriding}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-orange-500"
                  >
                    <Undo2 className="h-3.5 w-3.5 mr-1" />
                    Remove Override
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                    disabled={deleting}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Vote button */}
        <div className="flex flex-col items-center gap-1">
          <Button
            size="icon"
            variant={localVoted ? "default" : "outline"}
            onClick={(e) => { e.stopPropagation(); handleVote(); }}
            disabled={voting}
            className={`h-12 w-12 rounded-full transition-all duration-200 ${
              localVoted ? "theme-gradient border-0" : ""
            }`}
            style={!localVoted ? { borderColor: "color-mix(in srgb, var(--theme-primary) 50%, transparent)" } : undefined}
          >
            <ChevronUp className={`h-6 w-6 ${localVoted ? "text-white" : ""}`} />
          </Button>
          <span
            className="font-bold text-lg"
            style={{ color: localVoted ? "var(--theme-primary)" : undefined }}
          >
            {localCount}
          </span>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 pb-4 pt-2 border-t border-border/30">
              {isLoading ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-1.5">
                        <Skeleton className="w-14 h-14 rounded-full" />
                        <Skeleton className="h-2.5 w-12" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : details ? (
                <>
                  {/* Rating & meta */}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                    {details.vote_average != null && details.vote_average > 0 && (
                      <span className="flex items-center gap-1 font-medium" style={{ color: "var(--theme-primary)" }}>
                        <Star className="h-4 w-4 fill-current" />
                        {details.vote_average.toFixed(1)}
                      </span>
                    )}
                    {details.runtime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatRuntime(details.runtime)}
                      </span>
                    )}
                    {details.number_of_seasons && (
                      <span>
                        {details.number_of_seasons} season{details.number_of_seasons !== 1 ? "s" : ""}
                        {" \u00b7 "}
                        {details.number_of_episodes} episodes
                      </span>
                    )}
                  </div>

                  {/* Genres */}
                  {details.genres?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {details.genres.map((g: { id: number; name: string }) => (
                        <Badge key={g.id} variant="secondary" className="text-xs">
                          {g.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Tagline */}
                  {details.tagline && (
                    <p className="text-sm italic text-muted-foreground mb-3">
                      &ldquo;{details.tagline}&rdquo;
                    </p>
                  )}

                  {/* Created By (TV) */}
                  {details.created_by?.length > 0 && (
                    <p className="text-xs text-muted-foreground mb-3">
                      Created by{" "}
                      <span className="text-foreground">
                        {details.created_by.map((c: { name: string }) => c.name).join(", ")}
                      </span>
                    </p>
                  )}

                  {/* Cast */}
                  {cast.length > 0 && (
                    <div className="pt-1">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cast</h4>
                      <div className="cast-scroll">
                        {cast.map((member: { id: number; name: string; character: string; profile_path: string | null }) => (
                          <div key={member.id} className="flex flex-col items-center gap-1 min-w-[70px] max-w-[70px]">
                            <div className="w-14 h-14 rounded-full overflow-hidden bg-muted flex-shrink-0">
                              {member.profile_path ? (
                                <img
                                  src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                                  alt={member.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] font-medium leading-tight text-center truncate w-full">{member.name}</p>
                            <p className="text-[9px] text-muted-foreground leading-tight text-center truncate w-full">{member.character}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vote bar visualization */}
      <div className="h-1 bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(localCount * 10, 100)}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="h-full theme-gradient"
        />
      </div>
    </motion.div>
  );
}
