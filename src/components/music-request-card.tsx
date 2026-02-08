"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Music, ChevronUp, Check, AlertTriangle, Clock, Trash2, Disc, Calendar, Tag, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface MusicRequestCardProps {
  request: {
    id: number;
    deezerId: string | null;
    title: string;
    artistName: string | null;
    albumName: string | null;
    posterUrl: string | null;
    year: number | null;
    jellyfinStatus: string;
    voteCount: number;
    hasVoted: boolean;
    requestedBy: string;
  };
  isAdmin?: boolean;
  onVote: (id: number) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
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

export function MusicRequestCard({ request, isAdmin, onVote, onDelete }: MusicRequestCardProps) {
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
  const tracks = details?.tracks?.data || [];

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

  const statusConfig = {
    complete: { label: "In Library", icon: Check, variant: "success" as const },
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
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none theme-gradient-subtle" />

      <div className="relative flex gap-4 p-4">
        {/* Album Art (square) */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {request.posterUrl ? (
            <img
              src={request.posterUrl}
              alt={request.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg truncate">{request.title}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {request.artistName || "Unknown Artist"}
              {request.year && <span> ({request.year})</span>}
            </p>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Badge variant={status.variant} className="gap-1">
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              by {request.requestedBy}
            </span>
            {isAdmin && onDelete && (
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                disabled={deleting}
                className="h-6 w-6 ml-auto text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
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
                <div className="space-y-2">
                  <div className="flex gap-2 mb-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <div className="flex gap-1.5 mb-2">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-18 rounded-full" />
                  </div>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-5" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-10" />
                    </div>
                  ))}
                </div>
              ) : details ? (
                <>
                  {/* Album meta row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
                    {details.artist?.name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {details.artist.name}
                      </span>
                    )}
                    {details.release_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {details.release_date}
                      </span>
                    )}
                    {details.nb_tracks && (
                      <span className="flex items-center gap-1">
                        <Disc className="h-3 w-3" />
                        {details.nb_tracks} tracks
                      </span>
                    )}
                    {details.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTotalDuration(details.duration)}
                      </span>
                    )}
                  </div>

                  {/* Genres */}
                  {details.genres?.data?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {details.genres.data
                        .filter((g: { id: number; name: string }) => g.id !== 0)
                        .map((g: { id: number; name: string }) => (
                          <Badge key={g.id} variant="secondary" className="text-xs">
                            {g.name}
                          </Badge>
                        ))}
                    </div>
                  )}

                  {/* Label & type */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
                    {details.record_type && (
                      <span className="capitalize">{details.record_type}</span>
                    )}
                    {details.label && (
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {details.label}
                      </span>
                    )}
                    {details.explicit_lyrics && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        Explicit
                      </Badge>
                    )}
                  </div>

                  {/* Track listing */}
                  {tracks.length > 0 && (
                    <div className="divide-y divide-border/20">
                      {tracks.map((track: { id: number; title: string; duration: number }, index: number) => (
                        <div
                          key={track.id}
                          className="flex items-center gap-3 py-1.5"
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
                  )}
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vote bar */}
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
