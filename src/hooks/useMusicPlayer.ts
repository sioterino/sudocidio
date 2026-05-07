"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const TRACKS = [
  "/audio/music/track_1.mp3", // From The New World - Dvorak
  "/audio/music/track_2.mp3", // Lacrimosa - Mozart
  "/audio/music/track_3.mp3", // Dies Irae - Verdi
  "/audio/music/track_4.mp3", // Dance of The Knights - Prokofiev
  "/audio/music/track_5.mp3", // Valse Sentimentale - Tchaikovsky
  "/audio/music/track_6.mp3", // Danse Macabre - Saint Saens
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function useMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<string[]>([]);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Initialize the queue with shuffled tracks
  const initializeQueue = useCallback(() => {
    const shuffledTracks = shuffleArray(TRACKS);
    setQueue(shuffledTracks);
    setIsInitialized(true);
    return shuffledTracks;
  }, []);

  // Play the next track in the queue
  const playNext = useCallback(() => {
    setQueue((prevQueue) => {
      if (prevQueue.length === 0) return prevQueue;

      const [nextTrack, ...remainingQueue] = prevQueue;
      // Add the track back to the end of the queue
      const newQueue = [...remainingQueue, nextTrack];

      setCurrentTrack(nextTrack);
      setHasError(false);

      if (audioRef.current) {
        audioRef.current.src = nextTrack;
        audioRef.current.play().catch(() => {
          // Silently handle autoplay restrictions
          setIsPlaying(false);
        });
      }

      return newQueue;
    });
  }, []);

  // Start playing music
  const play = useCallback(() => {
    if (!isInitialized) {
      const shuffledTracks = initializeQueue();
      const [firstTrack, ...remainingQueue] = shuffledTracks;
      const newQueue = [...remainingQueue, firstTrack];
      setQueue(newQueue);
      setCurrentTrack(firstTrack);
      setHasError(false);

      if (audioRef.current) {
        audioRef.current.src = firstTrack;
        audioRef.current.play().catch(() => {
          setIsPlaying(false);
        });
      }
    } else if (audioRef.current) {
      audioRef.current.play().catch(() => {
        setIsPlaying(false);
      });
    }
    setIsPlaying(true);
  }, [isInitialized, initializeQueue]);

  // Pause music
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  // Toggle play/pause
  const toggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // Skip to next track
  const skip = useCallback(() => {
    playNext();
  }, [playNext]);

  // Set volume (0-1)
  const changeVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newMuted = !prev;
      if (audioRef.current) {
        audioRef.current.muted = newMuted;
      }
      return newMuted;
    });
  }, []);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;

      // When a track ends, play the next one
      audioRef.current.addEventListener("ended", playNext);

      // Handle play state changes
      audioRef.current.addEventListener("play", () => setIsPlaying(true));
      audioRef.current.addEventListener("pause", () => setIsPlaying(false));
      
      // Handle errors (e.g., file not found)
      audioRef.current.addEventListener("error", () => {
        setHasError(true);
        // Try to play the next track after a short delay
        setTimeout(playNext, 500);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", playNext);
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [playNext, volume, isMuted]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Update muted state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  return {
    play,
    pause,
    toggle,
    skip,
    changeVolume,
    toggleMute,
    isPlaying,
    currentTrack,
    volume,
    isMuted,
    queue,
    hasError,
  };
}
