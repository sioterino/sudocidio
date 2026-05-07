"use client";

import { useEffect } from "react";
import { useMusicPlayerContext } from "@/src/contexts/MusicPlayerContext";

export function MusicPlayer() {
  const {
    play,
    isPlaying,
    hasError,
  } = useMusicPlayerContext();

  useEffect(() => {
    const startMusic = () => {
      if (!isPlaying && !hasError) {
        play();
      }

      window.removeEventListener("click", startMusic);
    };

    window.addEventListener("click", startMusic);

    return () => {
      window.removeEventListener("click", startMusic);
    };
  }, [isPlaying, hasError, play]);

  return null;
}