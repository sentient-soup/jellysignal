"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Loader2 } from "lucide-react";
import { SearchBar } from "./search-bar";
import { MusicSearchBar } from "./music-search-bar";
import { RequestList } from "./request-list";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { AppMode } from "./header";

interface MainContentProps {
  user: {
    id: string;
    username: string;
    isAdmin: boolean;
  };
  mode: AppMode;
}

interface SearchResult {
  tmdbId: string;
  mediaType: "movie" | "tv";
  title: string;
  year: number | null;
  overview: string;
  posterUrl: string | null;
  rating: number;
  backdropUrl?: string | null;
}

interface MusicSearchResult {
  deezerId: string;
  title: string;
  artistName: string;
  albumName: string;
  coverUrl: string | null;
  year: number | null;
  previewUrl: string | null;
  type: "album";
}

export function MainContent({ user, mode }: MainContentProps) {
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  const createRequest = useMutation({
    mutationFn: async (result: SearchResult) => {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: result.tmdbId,
          mediaType: result.mediaType,
          title: result.title,
          year: result.year,
          posterUrl: result.posterUrl,
          backdropUrl: result.backdropUrl || null,
          overview: result.overview,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create request");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  const createMusicRequest = useMutation({
    mutationFn: async (result: MusicSearchResult) => {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deezerId: result.deezerId,
          mediaType: "music",
          title: result.title,
          year: result.year,
          posterUrl: result.coverUrl,
          artistName: result.artistName,
          albumName: result.albumName,
          previewUrl: result.previewUrl,
          overview: `Album by ${result.artistName}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create request");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  const handleRequest = async (result: SearchResult) => {
    try {
      await createRequest.mutateAsync(result);
    } catch (error) {
      console.error("Request failed:", error);
    }
  };

  const handleMusicRequest = async (result: MusicSearchResult) => {
    try {
      await createMusicRequest.mutateAsync(result);
    } catch (error) {
      console.error("Music request failed:", error);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <main className="container max-w-4xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Request{" "}
            <span className="gradient-text">
              {mode === "music" ? "Music" : "Media"}
            </span>
          </h1>
          <p className="text-muted-foreground">
            {mode === "music"
              ? "Search for albums to add to the library"
              : "Search for movies and TV shows to add to the library"}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Search */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`search-${mode}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="mb-8"
        >
          {mode === "music" ? (
            <MusicSearchBar onRequest={handleMusicRequest} />
          ) : (
            <SearchBar onRequest={handleRequest} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Admin Sync Button */}
      {user.isAdmin && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end mb-4"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
            className="gap-2"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Sync with Jellyfin
          </Button>
        </motion.div>
      )}

      {/* Request List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <RequestList isAdmin={user.isAdmin} mode={mode} currentUsername={user.username} />
      </motion.div>
    </main>
  );
}
