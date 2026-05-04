"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TopBar,
  CluesPanel,
  PiecesPanel,
  SabotagePanel,
  OpponentPreview,
  AccusationButton,
  PhaserMapWrapper,
  GameOverModal,
} from "@/src/components/gameplay";
import type { GameOverReason } from "@/src/components/gameplay";
import { ClueData } from "@/src/components/gameplay/CluesPanel";

const opponentPieces = [
  { row: 0, col: 2 }, { row: 1, col: 4 }, { row: 2, col: 6 }, { row: 3, col: 1 },
];

export default function GamePage() {
  const router = useRouter();
  const INITIAL_TIME = 322;
  const [time, setTime] = useState(INITIAL_TIME);
  const [activeClues, setActiveClues] = useState<ClueData[]>([]);
  
  // ESTADOS COM OS DADOS REAIS DO JOGO
  const [gameSuspects, setGameSuspects] = useState<any[]>([]);
  const [gameWeapons, setGameWeapons] = useState<any[]>([]);
  
  // ESTADOS DO GAME OVER
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverData, setGameOverData] = useState<{
    reason: GameOverReason;
    murderer?: string;
    weapon?: string;
    room?: string;
    opponentName?: string;
    elapsedTime?: number;
  } | null>(null);

  useEffect(() => {
    // Escuta as DICAS
    const handleNewHint = (event: Event) => {
      const hintData = (event as CustomEvent).detail;
      setActiveClues((prev) => [{
        id: Math.random().toString(36).substring(7),
        entityName: hintData.entityName,
        entityType: hintData.entityType,
        text: hintData.text,
        isInitial: hintData.isInitial
      }, ...prev]);
    };

    // Escuta a GERAÇÃO DOS PERSONAGENS REAIS
    const handleEntities = (event: Event) => {
      const data = (event as CustomEvent).detail;
      
      setActiveClues([]); 
      
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

  // LISTENER PARA GAME OVER (vitoria, tempo, oponente)
  useEffect(() => {
    // Vitoria: jogador acertou a acusacao
    const handleVictory = (event: Event) => {
      const data = (event as CustomEvent).detail;
      setGameOverData({
        reason: "victory",
        murderer: data.murderer,
        weapon: data.weapon,
        room: data.room,
        elapsedTime: INITIAL_TIME - time, // Tempo decorrido = inicial - restante
      });
      setIsGameOver(true);
    };

    // Derrota: oponente resolveu primeiro (via WebSocket)
    const handleOpponentWon = (event: Event) => {
      const data = (event as CustomEvent).detail;
      setGameOverData({
        reason: "opponent_won",
        murderer: data.murderer,
        weapon: data.weapon,
        room: data.room,
        opponentName: data.opponentName || "Oponente",
        elapsedTime: INITIAL_TIME - time,
      });
      setIsGameOver(true);
    };

    window.addEventListener("sudocidio:victory", handleVictory);
    window.addEventListener("sudocidio:opponentWon", handleOpponentWon);

    return () => {
      window.removeEventListener("sudocidio:victory", handleVictory);
      window.removeEventListener("sudocidio:opponentWon", handleOpponentWon);
    };
  }, [time]);

  // TIMER - para o jogo quando o tempo acabar
  useEffect(() => {
    if (isGameOver) return; // Nao conta se ja acabou
    
    const timer = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          // Tempo esgotado!
          setGameOverData({ 
            reason: "time_up",
            elapsedTime: INITIAL_TIME, // Usou todo o tempo
          });
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isGameOver]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins.toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  // Handlers do Game Over Modal
  const handlePlayAgain = () => {
    setIsGameOver(false);
    setGameOverData(null);
    setTime(INITIAL_TIME);
    setActiveClues([]);
    // Dispara evento para o Phaser regenerar o mapa
    window.dispatchEvent(new CustomEvent("sudocidio:restartGame"));
  };

  const handleGoHome = () => {
    router.push("/");
  };

  return (
    <main className="h-screen w-screen flex flex-col bg-wood-900 overflow-hidden scanlines">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "url('/assets/floor/wooden.png')", backgroundRepeat: "repeat", backgroundSize: "64px 64px" }} />

      {/* 👇 O SEGREDO ESTÁ AQUI: z-50 libera o modal para flutuar acima de tudo! */}
      <div className="relative z-50">
        <TopBar time={formatTime(time)} />
      </div>

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
          <AccusationButton disabled={isGameOver} />
        </div>
      </div>

      {/* MODAL DE FIM DE JOGO */}
      <GameOverModal
        isOpen={isGameOver}
        data={gameOverData}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
      />
    </main>
  );
}
