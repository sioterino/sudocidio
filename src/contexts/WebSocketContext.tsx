"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type SabotageType = "BLIND" | "SHUFFLE" | "LOCK";

export type ServerGameOverReason =
  | "ACCUSATION_CORRECT"
  | "OPPONENT_SURRENDERED"
  | "OPPONENT_DISCONNECTED"
  | "TIME_OUT";

export interface GameOverPayload {
  winnerId: string;
  reason: ServerGameOverReason;
}

export type MatchStatus = "IDLE" | "WAITING" | "PLAYING" | "FINISHED";

// ─── Interface do contexto ────────────────────────────────────────────────────

interface WebSocketContextType {
  isConnected: boolean;
  roomId: string | null;
  seed: string | null;
  matchStatus: MatchStatus;
  gameOverData: GameOverPayload | null;

  joinRoom: (playerId: string, playerName: string) => void;
  sendProgress: (playerId: string, roomId: string, progress: number) => void;
  sendSabotage: (playerId: string, roomId: string, sabotageType: SabotageType) => void;
  makeAccusation: (playerId: string, roomId: string, isCorrect: boolean) => void;
  surrender: (playerId: string, roomId: string) => void;
  resetMatch: () => void;
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const WebSocketContext = createContext<WebSocketContextType | null>(null);

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);

  // Se joinRoom for chamado antes da conexão estar pronta, guardamos aqui
  // e disparamos assim que o socket emitir "connect".
  const pendingJoinRef = useRef<{ playerId: string; playerName: string } | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [seed, setSeed] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<MatchStatus>("IDLE");
  const [gameOverData, setGameOverData] = useState<GameOverPayload | null>(null);

  useEffect(() => {
    if (socketRef.current) return;

    const socket = io(WS_URL, {
      transports: ["websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[WS] Conectado:", socket.id);
      setIsConnected(true);

      // ── Flush da ação pendente ─────────────────────────────────────────
      // findMatch() pode ter sido chamado antes da conexão estar pronta.
      // Aqui garantimos que o JOIN_ROOM será emitido após o connect.
      if (pendingJoinRef.current) {
        const { playerId, playerName } = pendingJoinRef.current;
        pendingJoinRef.current = null;
        console.log("[WS] Emitindo JOIN_ROOM pendente para:", playerId);
        socket.emit("JOIN_ROOM", { playerId, playerName });
      }
    });

    socket.on("disconnect", (reason) => {
      console.warn("[WS] Desconectado:", reason);
      setIsConnected(false);
    });

    socket.on("ROOM_JOINED", (payload: { roomId: string; status: string }) => {
      console.log("[WS] ROOM_JOINED:", payload);
      setRoomId(payload.roomId);
      setMatchStatus("WAITING");
    });

    socket.on("GAME_START", (payload: { roomId: string; seed: string }) => {
      console.log("[WS] GAME_START:", payload);
      setRoomId(payload.roomId);
      setSeed(payload.seed);
      setMatchStatus("PLAYING");
      setGameOverData(null);
    });

    socket.on("OPPONENT_PROGRESS", (payload: { opponentProgress: number }) => {
      window.dispatchEvent(
        new CustomEvent("sudocidio:opponentProgress", { detail: payload })
      );
    });

    socket.on("RECEIVE_SABOTAGE", (payload: { sabotageType: SabotageType }) => {
      console.log("[WS] Sabotagem recebida:", payload.sabotageType);
      window.dispatchEvent(
        new CustomEvent("sudocidio:receiveSabotage", { detail: payload })
      );
    });

    socket.on("GAME_OVER", (payload: GameOverPayload) => {
      console.log("[WS] GAME_OVER:", payload);
      setMatchStatus("FINISHED");
      setGameOverData(payload);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ─── Ações ────────────────────────────────────────────────────────────────

  const joinRoom = useCallback((playerId: string, playerName: string) => {
    const socket = socketRef.current;

    if (socket?.connected) {
      // Conexão pronta: emite imediatamente
      setMatchStatus("WAITING");
      socket.emit("JOIN_ROOM", { playerId, playerName });
    } else {
      // Conexão ainda não pronta: guarda para emitir no "connect"
      console.log("[WS] Socket ainda não conectado, agendando JOIN_ROOM...");
      pendingJoinRef.current = { playerId, playerName };
      setMatchStatus("WAITING");
    }
  }, []);

  const sendProgress = useCallback((playerId: string, roomId: string, progress: number) => {
    socketRef.current?.emit("PIECE_PLACED", { playerId, roomId, progress });
  }, []);

  const sendSabotage = useCallback((playerId: string, roomId: string, sabotageType: SabotageType) => {
    socketRef.current?.emit("SEND_SABOTAGE", { playerId, roomId, sabotageType });
  }, []);

  const makeAccusation = useCallback((playerId: string, roomId: string, isCorrect: boolean) => {
    socketRef.current?.emit("MAKE_ACCUSATION", { playerId, roomId, isCorrect });
  }, []);

  const surrender = useCallback((playerId: string, roomId: string) => {
    socketRef.current?.emit("SURRENDER", { playerId, roomId });
  }, []);

  const resetMatch = useCallback(() => {
    pendingJoinRef.current = null; // cancela qualquer join pendente
    setRoomId(null);
    setSeed(null);
    setMatchStatus("IDLE");
    setGameOverData(null);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        roomId,
        seed,
        matchStatus,
        gameOverData,
        joinRoom,
        sendProgress,
        sendSabotage,
        makeAccusation,
        surrender,
        resetMatch,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWebSocket(): WebSocketContextType {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocket deve estar dentro de <WebSocketProvider>");
  return ctx;
}