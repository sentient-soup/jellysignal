"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Music, Plus, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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

interface MusicSearchBarProps {
  onRequest: (result: MusicSearchResult) => Promise<void>;
}

export function MusicSearchBar({ onRequest }: MusicSearchBarProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["music-search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { results: [] };
      const res = await fetch(`/api/search/music?q=${encodeURIComponent(debouncedQuery)}`);
      return res.json();
    },
    enabled: debouncedQuery.length > 0,
  });

  const handleRequest = async (result: MusicSearchResult) => {
    setRequesting(result.deezerId);
    try {
      await onRequest(result);
      setQuery("");
      setIsOpen(false);
    } finally {
      setRequesting(null);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for albums..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10 h-12 text-lg bg-card/50 border-border/50 focus:border-neon-cyan/50 focus:ring-neon-cyan/20"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && query && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-2xl overflow-hidden z-50 max-h-[60vh] overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="w-16 h-16 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : data?.results?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No results found for &quot;{query}&quot;
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data?.results?.map((result: MusicSearchResult) => (
                  <motion.div
                    key={result.deezerId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="relative w-14 h-14 flex-shrink-0 rounded overflow-hidden bg-muted">
                      {result.coverUrl ? (
                        <img
                          src={result.coverUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling?.classList.remove("hidden"); }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center ${result.coverUrl ? "hidden" : ""}`}>
                        <Music className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-medium truncate">{result.title}</h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {result.artistName}
                            {result.year && <span> ({result.year})</span>}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="neon"
                          onClick={() => handleRequest(result)}
                          disabled={requesting === result.deezerId}
                          className="flex-shrink-0"
                        >
                          {requesting === result.deezerId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Request
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
