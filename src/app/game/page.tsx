"use client";

import { useState, useEffect } from "react";
import {
  TopBar,
  CluesPanel,
  PiecesPanel,
  MansionGrid,
  SabotagePanel,
  OpponentPreview,
  AccusationButton,
} from "@/src/components/gameplay"

// Game data
const clues = [
  {
    id: "1",
    type: "location" as const,
    text: "Vitima encontrada na GARAGEM. O corpo estava proximo a porta lateral.",
  },
  {
    id: "2",
    type: "witness" as const,
    text: "Uma faca de cozinha foi relatada desaparecida pelo mordomo.",
  },
  {
    id: "3",
    type: "time" as const,
    text: "O Suspeito A foi visto discutindo com a vitima por volta das 19h.",
  },
  {
    id: "4",
    type: "spatial" as const,
    text: "Uma pista espacial sugere que o crime NAO ocorreu na Sala de Estar.",
  },
];

const suspects = [
  { id: "a", name: "Suspeito A", color: "#c94a4a", colorClass: "suspect-a", sprite: "/npcs/SMA-D.png" },
  { id: "b", name: "Suspeito B", color: "#d4874d", colorClass: "suspect-b", sprite: "/npcs/SMB-G.png" },
  { id: "c", name: "Suspeito C", color: "#d4b34d", colorClass: "suspect-c", sprite: "/npcs/SMW-A.png" },
  { id: "d", name: "Suspeita D", color: "#4d9a4d", colorClass: "suspect-d", sprite: "/npcs/SFA-D.png" },
  { id: "e", name: "Suspeita E", color: "#4d9a9a", colorClass: "suspect-e", sprite: "/npcs/SFB-G.png" },
  { id: "f", name: "Suspeita F", color: "#8b4d8b", colorClass: "suspect-f", sprite: "/npcs/SFW-A.png" },
];

const weapons = [
  { id: "knife", name: "Faca", icon: "/weapons/knife.png" },
  { id: "wrench", name: "Chave", icon: "/weapons/wrench.png" },
  { id: "rope", name: "Corda", icon: "/weapons/rope.png" },
  { id: "candle", name: "Vela", icon: "/weapons/candle.png" },
  { id: "gun", name: "Pistola", icon: "/weapons/gun.png" },
  { id: "poison", name: "Veneno", icon: "/weapons/poison.png" },
];

const rooms = [
  {
    id: "garage",
    name: "GARAGEM",
    color: "#8b5a2b",
    cells: [
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },
      { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 },
      { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 },
    ],
  },
  {
    id: "kitchen",
    name: "COZINHA",
    color: "#d4a574",
    cells: [
      { row: 0, col: 3 }, { row: 0, col: 4 }, { row: 0, col: 5 },
      { row: 1, col: 3 }, { row: 1, col: 4 }, { row: 1, col: 5 },
    ],
  },
  {
    id: "living",
    name: "SALA",
    color: "#c4894d",
    cells: [
      { row: 0, col: 6 }, { row: 0, col: 7 }, { row: 0, col: 8 }, { row: 0, col: 9 },
      { row: 1, col: 6 }, { row: 1, col: 7 }, { row: 1, col: 8 }, { row: 1, col: 9 },
      { row: 2, col: 6 }, { row: 2, col: 7 }, { row: 2, col: 8 }, { row: 2, col: 9 },
    ],
  },
  {
    id: "office",
    name: "ESCRITORIO",
    color: "#6b4423",
    cells: [
      { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 },
      { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 },
    ],
  },
  {
    id: "hall",
    name: "CORREDOR",
    color: "#4a2f18",
    cells: [
      { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 },
      { row: 3, col: 4 }, { row: 3, col: 5 }, { row: 3, col: 6 },
      { row: 4, col: 4 }, { row: 4, col: 5 }, { row: 4, col: 6 },
    ],
  },
  {
    id: "bedroom",
    name: "QUARTO",
    color: "#8b4d8b",
    cells: [
      { row: 3, col: 7 }, { row: 3, col: 8 }, { row: 3, col: 9 },
      { row: 4, col: 7 }, { row: 4, col: 8 }, { row: 4, col: 9 },
    ],
  },
  {
    id: "bathroom",
    name: "BANHEIRO",
    color: "#4d9a9a",
    cells: [
      { row: 5, col: 0 }, { row: 5, col: 1 },
      { row: 6, col: 0 }, { row: 6, col: 1 },
    ],
  },
  {
    id: "garden",
    name: "JARDIM",
    color: "#4d9a4d",
    cells: [
      { row: 5, col: 2 }, { row: 5, col: 3 }, { row: 5, col: 4 }, { row: 5, col: 5 },
      { row: 6, col: 2 }, { row: 6, col: 3 }, { row: 6, col: 4 }, { row: 6, col: 5 },
    ],
  },
  {
    id: "library",
    name: "BIBLIOTECA",
    color: "#a86f3d",
    cells: [
      { row: 5, col: 6 }, { row: 5, col: 7 }, { row: 5, col: 8 }, { row: 5, col: 9 },
      { row: 6, col: 6 }, { row: 6, col: 7 }, { row: 6, col: 8 }, { row: 6, col: 9 },
    ],
  },
];

// Pre-placed pieces (example state)
const initialPlacedPieces = [
  { row: 1, col: 1, type: "weapon" as const, id: "candle", label: "V", color: "#d4b34d" },
  { row: 1, col: 7, type: "suspect" as const, id: "c", label: "C", color: "#d4b34d" },
  { row: 0, col: 1, type: "clue" as const, id: "rope-clue", label: "?" },
];

// Opponent pieces for mini-map
const opponentPieces = [
  { row: 0, col: 2 },
  { row: 1, col: 4 },
  { row: 2, col: 6 },
  { row: 3, col: 1 },
];

export default function GamePage() {
  const [time, setTime] = useState(322);
  const [placedPieces, setPlacedPieces] = useState(initialPlacedPieces);
  const [draggedPiece, setDraggedPiece] = useState<{ type: "suspect" | "weapon"; id: string } | null>(null);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDragStart = (type: "suspect" | "weapon", id: string) => {
    setDraggedPiece({ type, id });
  };

  const handleCellDrop = (row: number, col: number) => {
    if (!draggedPiece) return;

    const piece = draggedPiece.type === "suspect"
      ? suspects.find((s) => s.id === draggedPiece.id)
      : weapons.find((w) => w.id === draggedPiece.id);

    if (piece) {
      setPlacedPieces((prev) => [
        ...prev.filter((p) => !(p.row === row && p.col === col)),
        {
          row,
          col,
          type: draggedPiece.type,
          id: draggedPiece.id,
          label: piece.name.charAt(0).toUpperCase(),
          color: "color" in piece ? piece.color : "#d4a574",
        },
      ]);
    }

    setDraggedPiece(null);
  };

  const handleAccusation = () => {
    alert("Acusacao Final! (Implementar modal de acusacao)");
  };

  return (
    <main className="h-screen w-screen flex flex-col bg-wood-900 overflow-hidden scanlines">
      {/* Tiled wood background */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "url('/assets/floor/wooden.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Top Bar */}
      <div className="relative z-10">
        <TopBar time={formatTime(time)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-2 p-2 min-h-0 relative z-10">
        {/* Left Column */}
        <div className="w-52 flex flex-col gap-2 flex-shrink-0">
          <div className="flex-1 min-h-0">
            <CluesPanel clues={clues} />
          </div>
          <div className="flex-1 min-h-0">
            <PiecesPanel
              suspects={suspects}
              weapons={weapons}
              onDragStart={handleDragStart}
            />
          </div>
        </div>

        {/* Center Column - Mansion Grid */}
        <div className="flex-1 min-w-0">
          <MansionGrid
            rooms={rooms}
            placedPieces={placedPieces}
            onCellDrop={handleCellDrop}
          />
        </div>

        {/* Right Column */}
        <div className="w-48 flex flex-col gap-2 flex-shrink-0">
          <SabotagePanel />
          <OpponentPreview
            progress={7}
            total={12}
            opponentPieces={opponentPieces}
          />
          <AccusationButton onClick={handleAccusation} />
        </div>
      </div>
    </main>
  );
}
