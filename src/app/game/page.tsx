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

const opponentPieces = [
  { row: 0, col: 2 }, { row: 1, col: 4 }, { row: 2, col: 6 }, { row: 3, col: 1 },
];

export default function GamePage() {
  const [time, setTime] = useState(322);
  const [activeClues, setActiveClues] = useState<ClueData[]>([]);
  
  // ESTADOS COM OS DADOS REAIS DO JOGO
  const [gameSuspects, setGameSuspects] = useState<any[]>([]);
  const [gameWeapons, setGameWeapons] = useState<any[]>([]);

  useEffect(() => {
    // Escuta as DICAS
    const handleNewHint = (event: Event) => {
      const hintData = (event as CustomEvent).detail;
      setActiveClues((prev) => [{
        id: Math.random().toString(36).substring(7),
        entityName: hintData.entityName,
        entityType: hintData.entityType,
        text: hintData.text,
        isInitial: hintData.isInitial // 👉 Salva se é dica inicial para a estilização!
      }, ...prev]);
    };

    // Escuta a GERAÇÃO DOS PERSONAGENS REAIS
    const handleEntities = (event: Event) => {
      const data = (event as CustomEvent).detail;
      
      // 👉 Limpa as dicas do caso anterior se o mapa for reiniciado
      setActiveClues([]); 
      
      // Mantemos a sua paleta de cores original e aplicamos nos dados da Sofia
      const colors = ["#c94a4a", "#d4874d", "#d4b34d", "#4d9a4d", "#4d9a9a", "#8b4d8b"];
      const colorClasses = ["suspect-a", "suspect-b", "suspect-c", "suspect-d", "suspect-e", "suspect-f"];
      
      const mappedSuspects = data.suspects.map((s: any, index: number) => ({
        id: s.id || s.name,
        name: s.name,
        color: colors[index % colors.length],
        colorClass: colorClasses[index % colorClasses.length],
        sprite: s.texturePath,
        role: s.role === 'victim' ? 'victim' : 'suspect'      }));

      const mappedWeapons = data.weapons.map((w: any) => ({
        id: w.name,
        name: w.name,
        icon: w.texturePath
      }));

      setGameSuspects(mappedSuspects);
      setGameWeapons(mappedWeapons);
    };

    window.addEventListener("sudocidio:newHint", handleNewHint);
    window.addEventListener("sudocidio:entitiesGenerated", handleEntities);

    return () => {
      window.removeEventListener("sudocidio:newHint", handleNewHint);
      window.removeEventListener("sudocidio:entitiesGenerated", handleEntities);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins.toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  return (
    <main className="h-screen w-screen flex flex-col bg-wood-900 overflow-hidden scanlines">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "url('/assets/floor/wooden.png')", backgroundRepeat: "repeat", backgroundSize: "64px 64px" }} />

      <div className="relative z-10"><TopBar time={formatTime(time)} /></div>

      <div className="flex-1 flex gap-2 p-2 min-h-0 relative z-10">
        <div className="w-52 flex flex-col gap-2 flex-shrink-0">
          <div className="flex-1 min-h-0">
            <CluesPanel clues={activeClues} />
          </div>
          <div className="flex-1 min-h-0">
            <PiecesPanel suspects={gameSuspects} weapons={gameWeapons} />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-center">
          <PhaserMapWrapper seed="1234" />
        </div>

        <div className="w-48 flex flex-col gap-2 flex-shrink-0">
          <SabotagePanel />
          <OpponentPreview progress={7} total={12} opponentPieces={opponentPieces} />
          {/* 👉 O botão agora é limpo, toda a lógica está dentro dele! */}
          <AccusationButton />
        </div>
      </div>
    </main>
  );
}