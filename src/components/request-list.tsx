"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { RequestCard } from "./request-card";
import { MusicRequestCard } from "./music-request-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { AppMode } from "./header";

interface Request {
  id: number;
  tmdbId: string;
  mediaType: string;
  title: string;
  year: number | null;
  posterUrl: string | null;
  overview: string | null;
  deezerId: string | null;
  artistName: string | null;
  albumName: string | null;
  previewUrl: string | null;
  jellyfinStatus: string;
  voteCount: number;
  hasVoted: boolean;
  requestedBy: string;
}

interface RequestListProps {
  isAdmin?: boolean;
  mode: AppMode;
}

export function RequestList({ isAdmin, mode }: RequestListProps) {
  const [mediaFilter, setMediaFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("missing");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["requests"],
    queryFn: async () => {
      const res = await fetch("/api/requests");
      return res.json();
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await fetch(`/api/requests/${requestId}/vote`, {
        method: "POST",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "DELETE",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  const handleVote = async (requestId: number) => {
    await voteMutation.mutateAsync(requestId);
  };

  const handleDelete = async (requestId: number) => {
    await deleteMutation.mutateAsync(requestId);
  };

  let filteredRequests = data?.requests || [];

  // Filter by mode
  if (mode === "music") {
    filteredRequests = filteredRequests.filter(
      (r: Request) => r.mediaType === "music"
    );
  } else {
    filteredRequests = filteredRequests.filter(
      (r: Request) => r.mediaType !== "music"
    );
  }

  // Apply media type filter (only in media mode)
  if (mode === "media" && mediaFilter !== "all") {
    filteredRequests = filteredRequests.filter(
      (r: Request) => r.mediaType === mediaFilter
    );
  }

  if (statusFilter !== "all") {
    filteredRequests = filteredRequests.filter(
      (r: Request) => r.jellyfinStatus === statusFilter
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {mode === "media" ? (
          <Tabs value={mediaFilter} onValueChange={setMediaFilter}>
            <TabsList className="bg-card/50">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="movie">Movies</TabsTrigger>
              <TabsTrigger value="tv">TV Shows</TabsTrigger>
            </TabsList>
          </Tabs>
        ) : (
          <div />
        )}

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-card/50">
            <TabsTrigger value="all">All Status</TabsTrigger>
            <TabsTrigger value="missing">Requested</TabsTrigger>
            <TabsTrigger value="partial">Partial</TabsTrigger>
            <TabsTrigger value="complete">Complete</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Request list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl bg-card/50">
              <Skeleton className={`${mode === "music" ? "w-20 h-20" : "w-20 h-28"} rounded-lg`} />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="w-12 h-16 rounded-full" />
            </div>
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <p className="text-muted-foreground text-lg">
            {mode === "music"
              ? "No music requests yet. Search for an album to get started!"
              : "No requests found. Be the first to request something!"}
          </p>
        </motion.div>
      ) : (
        <motion.div layout className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredRequests.map((request: Request) =>
              request.mediaType === "music" ? (
                <MusicRequestCard
                  key={request.id}
                  request={request}
                  isAdmin={isAdmin}
                  onVote={handleVote}
                  onDelete={handleDelete}
                />
              ) : (
                <RequestCard
                  key={request.id}
                  request={request}
                  isAdmin={isAdmin}
                  onVote={handleVote}
                  onDelete={handleDelete}
                />
              )
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
