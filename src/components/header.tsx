"use client";

import { Radio, LogOut, User, Palette, Sun, Moon, Sparkles, Film, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { useTheme, themes, type Theme } from "@/lib/theme";
import { motion } from "framer-motion";

export type AppMode = "media" | "music";

interface HeaderProps {
  user: {
    id: string;
    username: string;
    isAdmin?: boolean;
    avatarUrl?: string;
  } | null;
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const themeIcons: Record<Theme, React.ReactNode> = {
  solar: <Sun className="h-4 w-4" />,
  orbit: <Moon className="h-4 w-4" />,
  aurora: <Sparkles className="h-4 w-4" />,
};

export function Header({ user, mode, onModeChange }: HeaderProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4">
        <div className="flex items-center gap-2">
          <Radio className="h-6 w-6" style={{ color: "var(--theme-primary)" }} />
          <span className="font-bold text-lg gradient-text hidden sm:inline">JellySignal</span>
        </div>

        {/* Mode Switcher */}
        {user && (
          <div className="flex items-center ml-4 sm:ml-6">
            <div className="relative flex rounded-lg bg-card/50 border border-border/50 p-0.5">
              {(["media", "music"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => onModeChange(m)}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors z-10"
                  style={{
                    color: mode === m ? "var(--theme-primary)" : undefined,
                  }}
                >
                  {m === "media" ? (
                    <Film className="h-3.5 w-3.5" />
                  ) : (
                    <Music className="h-3.5 w-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {m === "media" ? "Movies & TV" : "Music"}
                  </span>
                  {mode === m && (
                    <motion.div
                      layoutId="mode-indicator"
                      className="absolute inset-0 rounded-md border"
                      style={{
                        borderColor: "color-mix(in srgb, var(--theme-primary) 40%, transparent)",
                        backgroundColor: "color-mix(in srgb, var(--theme-primary) 10%, transparent)",
                      }}
                      transition={{ type: "spring", duration: 0.3, bounce: 0.15 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-1 items-center justify-end gap-2">
          {/* Theme Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {themes.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={theme === t.id ? "bg-accent" : ""}
                >
                  <span className="mr-2">{themeIcons[t.id]}</span>
                  <div className="flex flex-col">
                    <span>{t.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {t.description}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    {user.avatarUrl && (
                      <AvatarImage src={user.avatarUrl} alt={user.username} />
                    )}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.username}
                    </p>
                    {user.isAdmin && (
                      <p className="text-xs leading-none text-muted-foreground">
                        Administrator
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" onClick={() => router.push("/login")}>
              <User className="mr-2 h-4 w-4" />
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
