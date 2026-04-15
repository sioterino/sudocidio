"use client";

import { useState, useEffect } from "react";
import {
  TopBar,
  CluesPanel,
  PiecesPanel,
  SabotagePanel,
  OpponentPreview,
  AccusationButton,
  PhaserMapWrapper,
} from "@/src/components/gameplay";
import { ClueData } from "@/src/components/gameplay/CluesPanel";

// Game data (Apenas Suspeitos e Armas, pois o mapa agora é do Phaser)
const suspects = [
  { id: "a", name: "Suspeito A", color: "#c94a4a", colorClass: "suspect-a", sprite: "/assets/npcs/SMA-D.png" },
  { id: "b", name: "Suspeito B", color: "#d4874d", colorClass: "suspect-b", sprite: "/assets/npcs/SMB-G.png" },
  { id: "c", name: "Suspeito C", color: "#d4b34d", colorClass: "suspect-c", sprite: "/assets/npcs/SMW-A.png" },
  { id: "d", name: "Suspeita D", color: "#4d9a4d", colorClass: "suspect-d", sprite: "/assets/npcs/SFA-D.png" },
  { id: "e", name: "Suspeita E", color: "#4d9a9a", colorClass: "suspect-e", sprite: "/assets/npcs/SFB-G.png" },
  { id: "f", name: "Suspeita F", color: "#8b4d8b", colorClass: "suspect-f", sprite: "/assets/npcs/SFW-A.png" },
];

const weapons = [
  { id: "knife", name: "Faca", icon: "/assets/weapons/knife.png" },
  { id: "wrench", name: "Chave", icon: "/assets/weapons/wrench.png" },
  { id: "rope", name: "Corda", icon: "/assets/weapons/rope.png" },
  { id: "candle", name: "Vela", icon: "/assets/weapons/candle.png" },
  { id: "gun", name: "Pistola", icon: "/assets/weapons/gun.png" },
  { id: "poison", name: "Veneno", icon: "/assets/weapons/poison.png" },
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
  const [draggedPiece, setDraggedPiece] = useState<{ type: "suspect" | "weapon"; id: string } | null>(null);
  
  // ==========================================
  // 📻 RÁDIO AMADOR: Estado real das Dicas
  // ==========================================
  const [activeClues, setActiveClues] = useState<ClueData[]>([]);

  // Escuta os eventos disparados pelo Phaser da Sofia
  useEffect(() => {
    const handleNewHint = (event: Event) => {
      const hintData = (event as CustomEvent).detail;
      
      setActiveClues((prev) => {
        // Adiciona a dica no topo da lista com um ID gerado na hora
        return [{
          id: Math.random().toString(36).substring(7),
          entityName: hintData.entityName,
          entityType: hintData.entityType,
          text: hintData.text
        }, ...prev];
      });
    };

    // Assina a frequência
    window.addEventListener("sudocidio:newHint", handleNewHint);

    // Limpa a assinatura quando sair da tela
    return () => {
      window.removeEventListener("sudocidio:newHint", handleNewHint);
    };
  }, []);

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
            {/* Passando as dicas REAIS do estado para o painel */}
            <CluesPanel clues={activeClues} />
          </div>
          <div className="flex-1 min-h-0">
            <PiecesPanel
              suspects={suspects}
              weapons={weapons}
              onDragStart={handleDragStart}
            />
          </div>
        </div>

        {/* Center Column - Mapa Procedural da Sofia (Phaser) */}
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <PhaserMapWrapper seed="1234" />
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