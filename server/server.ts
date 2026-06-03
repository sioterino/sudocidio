import { Server, Socket } from "socket.io";
import { createServer } from "http";
import webpush from "web-push";
import "dotenv/config";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// ─── VAPID ────────────────────────────────────────────────────────────────────

webpush.setVapidDetails(
  process.env.VAPID_MAILTO!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Player {
  socketId: string;
  playerId: string;
  playerName: string;
  progress: number;
}

interface Room {
  roomId: string;
  seed: string;
  players: Player[];
  status: "WAITING_FOR_OPPONENT" | "PLAYING" | "FINISHED";
}

// ─── Estado em memória ────────────────────────────────────────────────────────

const rooms = new Map<string, Room>();
let waitingPlayer: Player | null = null;
const pushSubscriptions = new Map<string, PushSubscription>(); // socketId → sub

// ─── Helpers ──────────────────────────────────────────────────────────────────

function finishRoom(
  roomId: string,
  winnerId: string,
  reason: "ACCUSATION_CORRECT" | "OPPONENT_SURRENDERED" | "OPPONENT_DISCONNECTED" | "TIME_OUT"
) {
  const room = rooms.get(roomId);
  if (!room || room.status === "FINISHED") return;
  room.status = "FINISHED";
  io.to(roomId).emit("GAME_OVER", { winnerId, reason });
  rooms.delete(roomId);
  console.log(`[Room] ${roomId} encerrada → vencedor: ${winnerId} (${reason})`);
}

function findRoomBySocket(socketId: string): [string, Room] | null {
  for (const [roomId, room] of rooms.entries()) {
    if (room.players.some((p) => p.socketId === socketId)) return [roomId, room];
  }
  return null;
}

async function sendPushToRoom(room: Room) {
  const payload = JSON.stringify({
    title: "Sudocídio (Push)",
    body: "Um oponente foi encontrado — o caso começa agora!",
  });

  for (const player of room.players) {
    const sub = pushSubscriptions.get(player.socketId);
    if (!sub) continue;
    try {
      await webpush.sendNotification(sub as any, payload);
      console.log(`[Push] Enviado para ${player.playerName}`);
    } catch (err) {
      console.error(`[Push] Falhou para ${player.playerName}:`, err);
      pushSubscriptions.delete(player.socketId);
    }
  }
}

// ─── Eventos ──────────────────────────────────────────────────────────────────

io.on("connection", (socket: Socket) => {
  console.log(`[Socket] Conectado: ${socket.id}`);

  // 0. PUSH SUBSCRIPTION
  socket.on("PUSH_SUBSCRIBE", (sub: PushSubscription) => {
    pushSubscriptions.set(socket.id, sub);
    console.log(`[Push] Subscription salva para ${socket.id}`);
  });

  // 1. MATCHMAKING
  socket.on("JOIN_ROOM", (payload: { playerId: string; playerName: string }) => {
    const newPlayer: Player = {
      socketId: socket.id,
      playerId: payload.playerId,
      playerName: payload.playerName,
      progress: 0,
    };

    if (waitingPlayer && waitingPlayer.socketId !== socket.id) {
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const seed = Date.now().toString();

      const room: Room = {
        roomId,
        seed,
        players: [waitingPlayer, newPlayer],
        status: "PLAYING",
      };

      rooms.set(roomId, room);

      const waitingSocket = io.sockets.sockets.get(waitingPlayer.socketId);
      if (waitingSocket) waitingSocket.join(roomId);
      socket.join(roomId);

      waitingPlayer = null;

      io.to(roomId).emit("GAME_START", { roomId, seed });
      sendPushToRoom(room); // ← dispara push para os dois jogadores
      console.log(`[Room] ${roomId} criada | seed: ${seed}`);
    } else {
      waitingPlayer = newPlayer;
      socket.emit("ROOM_JOINED", { roomId: "queue", status: "WAITING_FOR_OPPONENT" });
      console.log(`[Queue] ${payload.playerName} aguardando...`);
    }
  });

  // 2. PROGRESSO
  socket.on("PIECE_PLACED", (payload: { roomId: string; playerId: string; progress: number }) => {
    socket.to(payload.roomId).emit("OPPONENT_PROGRESS", { opponentProgress: payload.progress });

    const room = rooms.get(payload.roomId);
    if (room) {
      const player = room.players.find((p) => p.playerId === payload.playerId);
      if (player) player.progress = payload.progress;
    }
  });

  // 3. SABOTAGENS
  socket.on("SEND_SABOTAGE", (payload: { roomId: string; playerId: string; sabotageType: string }) => {
    socket.to(payload.roomId).emit("RECEIVE_SABOTAGE", { sabotageType: payload.sabotageType });
    console.log(`[Sabotage] ${payload.sabotageType} → sala ${payload.roomId}`);
  });

  // 4. FIM DE JOGO
  socket.on("MAKE_ACCUSATION", (payload: { roomId: string; playerId: string; isCorrect: boolean }) => {
    if (!payload.isCorrect) return;
    finishRoom(payload.roomId, payload.playerId, "ACCUSATION_CORRECT");
  });

  socket.on("SURRENDER", (payload: { roomId: string; playerId: string }) => {
    const room = rooms.get(payload.roomId);
    if (!room) return;
    const opponent = room.players.find((p) => p.playerId !== payload.playerId);
    finishRoom(payload.roomId, opponent?.playerId || "OPPONENT", "OPPONENT_SURRENDERED");
  });

  // 5. DESCONEXÃO
  socket.on("disconnect", () => {
    console.log(`[Socket] Desconectado: ${socket.id}`);
    pushSubscriptions.delete(socket.id); // limpa subscription

    if (waitingPlayer?.socketId === socket.id) {
      waitingPlayer = null;
      return;
    }

    const entry = findRoomBySocket(socket.id);
    if (!entry) return;

    const [roomId, room] = entry;
    if (room.status !== "PLAYING") return;

    const opponent = room.players.find((p) => p.socketId !== socket.id);
    finishRoom(roomId, opponent?.playerId || "OPPONENT", "OPPONENT_DISCONNECTED");
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT) || 3001;
httpServer.listen(PORT, () => {
  console.log(`[Server] Rodando em http://localhost:${PORT}`);
});