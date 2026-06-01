"use client";

import { useEffect, useRef, useCallback } from "react";
import { useWebSocket, ServerGameOverReason } from "../contexts/WebSocketContext";

// ─── ID persistente por sessão ────────────────────────────────────────────────

function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return "anon";
  let id = sessionStorage.getItem("sudocidio:playerId");
  if (!id) {
    id = `player_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    sessionStorage.setItem("sudocidio:playerId", id);
  }
  return id;
}

function getPlayerName(): string {
  if (typeof window === "undefined") return "Detetive";
  return sessionStorage.getItem("sudocidio:playerName") || "Detetive";
}

// ─── Opções do hook ───────────────────────────────────────────────────────────

interface UseMultiplayerOptions {
  onGameStart?: (seed: string) => void;
  onGameOver?: (payload: { isWinner: boolean; reason: ServerGameOverReason }) => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMultiplayer({ onGameStart, onGameOver }: UseMultiplayerOptions = {}) {
  const ws = useWebSocket();
  const playerId = useRef(getOrCreatePlayerId());
  const playerName = useRef(getPlayerName());

  // Dispara onGameStart quando o servidor confirmar GAME_START
  useEffect(() => {
    if (ws.matchStatus === "PLAYING" && ws.seed) {
      onGameStart?.(ws.seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.matchStatus, ws.seed]);

  // Dispara onGameOver quando o servidor confirmar GAME_OVER
  useEffect(() => {
    if (ws.matchStatus === "FINISHED" && ws.gameOverData) {
      const isWinner = ws.gameOverData.winnerId === playerId.current;
      onGameOver?.({ isWinner, reason: ws.gameOverData.reason });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ws.matchStatus, ws.gameOverData]);

  // ─── Ações ────────────────────────────────────────────────────────────────

  const findMatch = useCallback(() => {
    ws.resetMatch();
    ws.joinRoom(playerId.current, playerName.current);
  }, [ws]);

  const reportProgress = useCallback(
    (progress: number) => {
      if (!ws.roomId) return;
      ws.sendProgress(playerId.current, ws.roomId, progress);
    },
    [ws]
  );

  const sendSabotage = useCallback(
    (sabotageType: "BLIND" | "SHUFFLE" | "LOCK") => {
      if (!ws.roomId) return;
      ws.sendSabotage(playerId.current, ws.roomId, sabotageType);
    },
    [ws]
  );

  const accuse = useCallback(
    (isCorrect: boolean) => {
      if (!ws.roomId) return;
      ws.makeAccusation(playerId.current, ws.roomId, isCorrect);
    },
    [ws]
  );

  const giveUp = useCallback(() => {
    if (!ws.roomId) return;
    ws.surrender(playerId.current, ws.roomId);
  }, [ws]);

  return {
    playerId: playerId.current,
    playerName: playerName.current,
    isConnected: ws.isConnected,
    matchStatus: ws.matchStatus,
    roomId: ws.roomId,
    seed: ws.seed,
    gameOverData: ws.gameOverData,
    findMatch,
    reportProgress,
    sendSabotage,
    accuse,
    giveUp,
    resetMatch: ws.resetMatch,
  };
}