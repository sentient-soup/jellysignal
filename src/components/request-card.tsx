"use client";

import { motion } from "framer-motion";
import { Film, Tv, ChevronUp, Check, AlertTriangle, Clock, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    voteCount: number;
    hasVoted: boolean;
    requestedBy: string;
  };
  isAdmin?: boolean;
  onVote: (id: number) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

export function RequestCard({ request, isAdmin, onVote, onDelete }: RequestCardProps) {
  const [voting, setVoting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localVoted, setLocalVoted] = useState(request.hasVoted);
  const [localCount, setLocalCount] = useState(request.voteCount);

  const handleVote = async () => {
    setVoting(true);
    // Optimistic update
    setLocalVoted(!localVoted);
    setLocalCount(localVoted ? localCount - 1 : localCount + 1);

    try {
      await onVote(request.id);
    } catch {
      // Revert on error
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
    complete: {
      label: "In Library",
      icon: Check,
      variant: "success" as const,
    },
    partial: {
      label: "Partial",
      icon: AlertTriangle,
      variant: "warning" as const,
    },
    missing: {
      label: "Requested",
      icon: Clock,
      variant: "pending" as const,
    },
  };

  const status = statusConfig[request.jellyfinStatus as keyof typeof statusConfig] || statusConfig.missing;
  const StatusIcon = status.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      className="group relative glass rounded-xl overflow-hidden border border-border/50 transition-all duration-300"
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
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {request.overview || "No description available"}
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
                onClick={handleDelete}
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
            onClick={handleVote}
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
