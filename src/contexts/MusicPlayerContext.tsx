"use client";

import { createContext, useContext, ReactNode } from "react";
import { useMusicPlayer } from "@/src/hooks/useMusicPlayer";

type MusicPlayerContextType = ReturnType<typeof useMusicPlayer>;

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const musicPlayer = useMusicPlayer();

  return (
    <MusicPlayerContext.Provider value={musicPlayer}>
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayerContext() {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error(
      "useMusicPlayerContext must be used within a MusicPlayerProvider"
    );
  }
  return context;
}
