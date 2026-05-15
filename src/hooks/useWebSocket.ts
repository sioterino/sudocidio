// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface WebSocketState {
    isConnected: boolean;
    roomId: string | null;
    opponentStatus: "WAITING_FOR_OPPONENT" | "IN_GAME" | null;
    seed: string | null;
    joinRoom: (playerId: string, playerName: string) => void;
    sendPiecePlaced: (playerId: string, progress: number) => void;
    sendAccusation: (roomId: string, murderer: string, weapon: string, room: string) => void;
    reportSolution: (roomId: string, murderer: string, weapon: string, room: string) => void;
}

export const useWebSocket = (): WebSocketState => {
    const socketRef = useRef<Socket | null>(null);

    const [isConnected, setIsConnected]       = useState(false);
    const [roomId, setRoomId]                 = useState<string | null>(null);
    const [opponentStatus, setOpponentStatus] = useState<"WAITING_FOR_OPPONENT" | "IN_GAME" | null>(null);
    const [seed, setSeed]                     = useState<string | null>(null);

    useEffect(() => {
        socketRef.current = io("http://localhost:3001");
        const socket = socketRef.current;

        socket.on("connect", () => setIsConnected(true));

        socket.on("disconnect", () => {
            setIsConnected(false);
            setRoomId(null);
            setOpponentStatus(null);
            setSeed(null);
        });

        socket.on("ROOM_JOINED", (data) => {
            setRoomId(data.roomId);
            setOpponentStatus(data.status);
        });

        socket.on("GAME_START", (data) => {
            setRoomId(data.roomId);
            setSeed(data.seed);
            setOpponentStatus("IN_GAME");

            // Dispara para o Phaser inicializar com a seed correta do servidor
            window.dispatchEvent(new CustomEvent("sudocidio:startGame", {
                detail: { seed: data.seed }
            }));
        });

        socket.on("OPPONENT_PROGRESS", (data) => {
            window.dispatchEvent(new CustomEvent("sudocidio:opponentProgress", { detail: data }));
        });

        // GAME_OVER carrega isWinner para separar vitória de derrota
        socket.on("GAME_OVER", (data) => {
            const eventName = data.isWinner ? "sudocidio:victory" : "sudocidio:opponentWon";
            window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
        });

        socket.on("ACCUSATION_RESULT", (data) => {
            window.dispatchEvent(new CustomEvent("sudocidio:accusationResult", { detail: data }));
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const joinRoom = useCallback((playerId: string, playerName: string) => {
        socketRef.current?.emit("JOIN_ROOM", { playerId, playerName });
    }, []);

    const sendPiecePlaced = useCallback((playerId: string, progress: number) => {
        socketRef.current?.emit("PIECE_PLACED", { playerId, progress });
    }, []);

    // Envia acusação ao servidor — validação acontece lá, não no cliente
    const sendAccusation = useCallback((roomId: string, murderer: string, weapon: string, room: string) => {
        socketRef.current?.emit("PLAYER_ACCUSATION", { roomId, murderer, weapon, room });
    }, []);

    // Registra a solução canônica do caso no servidor logo após gerar o mapa
    const reportSolution = useCallback((roomId: string, murderer: string, weapon: string, room: string) => {
        socketRef.current?.emit("REPORT_SOLUTION", { roomId, murderer, weapon, room });
    }, []);

    return {
        isConnected,
        roomId,
        opponentStatus,
        seed,
        joinRoom,
        sendPiecePlaced,
        sendAccusation,
        reportSolution,
    };
};