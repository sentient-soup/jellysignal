"use client";

import { useState } from "react";
import { Header, type AppMode } from "./header";
import { MainContent } from "./main-content";

interface AppShellProps {
  user: {
    id: string;
    username: string;
    isAdmin: boolean;
    avatarUrl?: string;
  };
}

export function AppShell({ user }: AppShellProps) {
  const [mode, setMode] = useState<AppMode>("media");

  return (
    <>
      <Header user={user} mode={mode} onModeChange={setMode} />
      <MainContent user={user} mode={mode} />
    </>
  );
}
