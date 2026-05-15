import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

interface RoomState {
    players: string[];
    seed: string;
    solution: {
        murderer: string;
        weapon: string;
        room: string;
    } | null;
    isGameOver: boolean;
}

const activeRooms = new Map<string, RoomState>();
let waitingPlayer: Socket | null = null;

function generateRoomSeed(): string {
    return Date.now().toString();
}

io.on("connection", (socket: Socket) => {
    console.log(`jogador conectou: ${socket.id}`);

    // ENTRAR NA FILA / SALA
    socket.on("JOIN_ROOM", () => {
        if (waitingPlayer && waitingPlayer.id !== socket.id) {
            const roomId = `room_${waitingPlayer.id}_${socket.id}`;
            const seed = generateRoomSeed();

            waitingPlayer.join(roomId);
            socket.join(roomId);

            activeRooms.set(roomId, {
                players: [waitingPlayer.id, socket.id],
                seed,
                solution: null,
                isGameOver: false,
            });

            // Todos recebem a MESMA seed — ninguém gera caso localmente
            io.to(roomId).emit("GAME_START", { roomId, seed });

            console.log(`Sala ${roomId} criada com seed ${seed}`);
            waitingPlayer = null;
        } else {
            waitingPlayer = socket;
            socket.emit("ROOM_JOINED", { roomId: "pending", status: "WAITING_FOR_OPPONENT" });
        }
    });

    // CLIENTE REPORTA A SOLUÇÃO DO CASO (gerada deterministicamente pela seed)
    // O primeiro cliente a reportar define a solução canônica da sala.
    socket.on("REPORT_SOLUTION", (data: {
        roomId: string;
        murderer: string;
        weapon: string;
        room: string;
    }) => {
        const roomState = activeRooms.get(data.roomId);
        if (!roomState) return;

        // Só aceita a primeira notificação — evita divergências
        if (!roomState.solution) {
            roomState.solution = {
                murderer: data.murderer,
                weapon: data.weapon,
                room: data.room,
            };
            console.log(`Solução registrada na sala ${data.roomId}:`, roomState.solution);
        }
    });

    // ACUSAÇÃO DO JOGADOR — validação centralizada no servidor
    socket.on("PLAYER_ACCUSATION", (data: {
        roomId: string;
        murderer: string;
        weapon: string;
        room: string;
    }) => {
        const roomState = activeRooms.get(data.roomId);
        if (!roomState || roomState.isGameOver || !roomState.solution) return;

        const normalize = (s: string) =>
            (s || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const sol = roomState.solution;
        const correct =
            normalize(data.murderer) === normalize(sol.murderer) &&
            normalize(data.weapon)   === normalize(sol.weapon)   &&
            normalize(data.room)     === normalize(sol.room);

        if (correct) {
            // Bloqueia qualquer outra acusação simultânea (race condition)
            roomState.isGameOver = true;

            // Vencedor
            socket.emit("GAME_OVER", {
                winnerId: socket.id,
                isWinner: true,
                reason: "victory",
                murderer: sol.murderer,
                weapon: sol.weapon,
                room: sol.room,
            });

            // Perdedores
            socket.to(data.roomId).emit("GAME_OVER", {
                winnerId: socket.id,
                isWinner: false,
                reason: "opponent_won",
                murderer: sol.murderer,
                weapon: sol.weapon,
                room: sol.room,
            });

            console.log(`Partida encerrada na sala ${data.roomId}. Vencedor: ${socket.id}`);
        } else {
            socket.emit("ACCUSATION_RESULT", { correct: false });
        }
    });

    // PROGRESSO DE PEÇAS
    socket.on("PIECE_PLACED", (data: { playerId: string; progress: number }) => {
        for (const [roomId, roomState] of activeRooms.entries()) {
            if (roomState.players.includes(socket.id)) {
                socket.to(roomId).emit("OPPONENT_PROGRESS", data);
                break;
            }
        }
    });

    // JOGAR NOVAMENTE
    socket.on("RESTART_MATCH", (data: { roomId: string }) => {
        if (data.roomId) {
            socket.leave(data.roomId);
            activeRooms.delete(data.roomId);
        }
    });

    // DESCONEXÃO
    socket.on("disconnect", () => {
        console.log(`jogador desconectou: ${socket.id}`);

        if (waitingPlayer?.id === socket.id) {
            waitingPlayer = null;
            return;
        }

        for (const [roomId, roomState] of activeRooms.entries()) {
            if (!roomState.players.includes(socket.id)) continue;

            if (!roomState.isGameOver) {
                roomState.isGameOver = true;
                socket.to(roomId).emit("GAME_OVER", {
                    winnerId: "opponent",
                    isWinner: true,
                    reason: "opponent_disconnected",
                    murderer: roomState.solution?.murderer,
                    weapon: roomState.solution?.weapon,
                    room: roomState.solution?.room,
                });
            }

            activeRooms.delete(roomId);
            break;
        }
    });
});

server.listen(3001, () => console.log("servidor multiplayer rodando na porta 3001"));