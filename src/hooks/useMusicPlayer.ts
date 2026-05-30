"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const TRACKS = [
  "/audio/music/track_1.mp3",
  "/audio/music/track_2.mp3",
  "/audio/music/track_3.mp3",
  "/audio/music/track_4.mp3",
  "/audio/music/track_5.mp3",
  "/audio/music/track_6.mp3",
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

  // Refs para ter sempre o valor atual dentro de callbacks
  const volumeRef = useRef(0.5);
  const isMutedRef = useRef(false);

  const applyVolume = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMutedRef.current ? 0 : volumeRef.current;
  }, []);

  const initializeQueue = useCallback(() => {
    const shuffledTracks = shuffleArray(TRACKS);
    setQueue(shuffledTracks);
    setIsInitialized(true);
    return shuffledTracks;
  }, []);

  const playNext = useCallback(() => {
    setQueue((prevQueue) => {
      if (prevQueue.length === 0) return prevQueue;
      const [nextTrack, ...remainingQueue] = prevQueue;
      const newQueue = [...remainingQueue, nextTrack];
      setCurrentTrack(nextTrack);
      setHasError(false);
      if (audioRef.current) {
        audioRef.current.src = nextTrack;
        applyVolume();
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
      return newQueue;
    });
  }, [applyVolume]);

  const play = useCallback(() => {
    if (!isInitialized) {
      const shuffledTracks = initializeQueue();
      const [firstTrack, ...remainingQueue] = shuffledTracks;
      setQueue([...remainingQueue, firstTrack]);
      setCurrentTrack(firstTrack);
      setHasError(false);
      if (audioRef.current) {
        audioRef.current.src = firstTrack;
        applyVolume();
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } else if (audioRef.current) {
      applyVolume();
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
    setIsPlaying(true);
  }, [isInitialized, initializeQueue, applyVolume]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const skip = useCallback(() => playNext(), [playNext]);

  const changeVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    volumeRef.current = clamped;
    setVolume(clamped);
    // Se estava mudo e mudou o volume, desmuta
    if (isMutedRef.current && clamped > 0) {
      isMutedRef.current = false;
      setIsMuted(false);
    }
    applyVolume();
  }, [applyVolume]);

  const toggleMute = useCallback(() => {
    const newMuted = !isMutedRef.current;
    isMutedRef.current = newMuted;
    setIsMuted(newMuted);
    applyVolume();
  }, [applyVolume]);

  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio();
      applyVolume();

      audioRef.current.addEventListener("ended", playNext);
      audioRef.current.addEventListener("play", () => setIsPlaying(true));
      audioRef.current.addEventListener("pause", () => setIsPlaying(false));
      audioRef.current.addEventListener("error", () => {
        setHasError(true);
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
  }, [playNext, applyVolume]);

  return {
    play, pause, toggle, skip,
    changeVolume, toggleMute,
    isPlaying, currentTrack,
    volume, isMuted,
    queue, hasError,
  };
}