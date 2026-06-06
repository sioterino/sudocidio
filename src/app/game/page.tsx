"use client";

import { useState, useEffect, useCallback } from "react";
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
import type { GameOverReason as UIGameOverReason } from "@/src/components/gameplay";
import { ClueData } from "@/src/components/gameplay/CluesPanel";
import { WebSocketProvider } from "@/src/contexts/WebSocketContext";
import { AuthProvider } from "@/src/contexts/AuthContext"; // 👈 único import novo
import { useMultiplayer } from "@/src/hooks/useMultiplayer";
import type { ServerGameOverReason } from "@/src/contexts/WebSocketContext";

// ─── Constantes ───────────────────────────────────────────────────────────────

const INITIAL_TIME = 180;

// Altere conforme seu cadastro na Feira de Jogos
const FEIRA_PRODUCT_ID = 42;
const FEIRA_CREDIT_VALUE = 100;

// ─── Mapeia razão do servidor → razão da UI ───────────────────────────────────

function mapReason(reason: ServerGameOverReason, isWinner: boolean): UIGameOverReason {
  if (reason === "ACCUSATION_CORRECT") return isWinner ? "victory" : "opponent_won";
  if (reason === "OPPONENT_SURRENDERED") return "victory";
  if (reason === "OPPONENT_DISCONNECTED") return "victory";
  if (reason === "TIME_OUT") return "time_up";
  return isWinner ? "victory" : "opponent_won";
}

// ─── GamePage ─────────────────────────────────────────────────────────────────

function GamePageInner() {
  const router = useRouter();

  const [time, setTime] = useState(INITIAL_TIME);
  const [activeClues, setActiveClues] = useState<ClueData[]>([]);
  const [matchId, setMatchId] = useState(0);
  const [gameSuspects, setGameSuspects] = useState<any[]>([]);
  const [gameWeapons, setGameWeapons] = useState<any[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverData, setGameOverData] = useState<{
    reason: UIGameOverReason;
    murderer?: string;
    weapon?: string;
    room?: string;
    opponentName?: string;
    elapsedTime?: number;
  } | null>(null);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);

  const {
    matchStatus,
    seed,
    findMatch,
    reportProgress,
    sendSabotage,
    accuse,
    giveUp,
    resetMatch,
  } = useMultiplayer({
    onGameStart: (_seed) => {
      setIsGameOver(false);
      setGameOverData(null);
      setTime(INITIAL_TIME);
      setActiveClues([]);
      setCurrentProgress(0);
      setOpponentProgress(0);
      setMatchId((prev) => prev + 1);
    },
    onGameOver: ({ isWinner, reason }) => {
      setGameOverData({
        reason: mapReason(reason, isWinner),
        elapsedTime: INITIAL_TIME - time,
      });
      setIsGameOver(true);
    },
  });

  const activeSeed = seed ?? (matchId > 0 ? Date.now().toString() : "1234");

  useEffect(() => {
    const handleNewHint = (event: Event) => {
      const hintData = (event as CustomEvent).detail;
      setActiveClues((prev) => [
        {
          id: Math.random().toString(36).substring(7),
          entityName: hintData.entityName,
          entityType: hintData.entityType,
          text: hintData.text,
          isInitial: hintData.isInitial,
        },
        ...prev,
      ]);
    };

    const handleEntities = (event: Event) => {
      const data = (event as CustomEvent).detail;
      setActiveClues([]);
      const colors = ["#c94a4a", "#d4874d", "#d4b34d", "#4d9a4d", "#4d9a9a", "#8b4d8b"];
      const colorClasses = ["suspect-a", "suspect-b", "suspect-c", "suspect-d", "suspect-e", "suspect-f"];
      setGameSuspects(
        data.suspects.map((s: any, i: number) => ({
          id: s.id || s.name,
          name: s.name,
          color: colors[i % colors.length],
          colorClass: colorClasses[i % colorClasses.length],
          sprite: s.texturePath,
          role: s.role === "victim" ? "victim" : "suspect",
        }))
      );
      setGameWeapons(
        data.weapons.map((w: any) => ({
          id: w.name,
          name: w.name,
          icon: w.texturePath,
        }))
      );
    };

    window.addEventListener("sudocidio:newHint", handleNewHint);
    window.addEventListener("sudocidio:entitiesGenerated", handleEntities);
    return () => {
      window.removeEventListener("sudocidio:newHint", handleNewHint);
      window.removeEventListener("sudocidio:entitiesGenerated", handleEntities);
    };
  }, []);

  useEffect(() => {
    const handleProgress = (event: Event) => {
      const { correctCount } = (event as CustomEvent).detail;
      setCurrentProgress(correctCount);
      reportProgress(correctCount);
    };
    window.addEventListener('sudocidio:progressUpdate', handleProgress);
    return () => window.removeEventListener('sudocidio:progressUpdate', handleProgress);
  }, [reportProgress]);

  useEffect(() => {
    const handleOpponentProgress = (event: Event) => {
      setOpponentProgress((event as CustomEvent).detail.opponentProgress);
    };
    window.addEventListener("sudocidio:opponentProgress", handleOpponentProgress);
    return () => window.removeEventListener("sudocidio:opponentProgress", handleOpponentProgress);
  }, []);

  useEffect(() => {
    const handleReceiveSabotage = (event: Event) => {
      const { sabotageType } = (event as CustomEvent).detail;
      window.dispatchEvent(new CustomEvent("sudocidio:applySabotage", { detail: { sabotageType } }));
    };
    window.addEventListener("sudocidio:receiveSabotage", handleReceiveSabotage);
    return () => window.removeEventListener("sudocidio:receiveSabotage", handleReceiveSabotage);
  }, []);

  useEffect(() => {
    const handleSendSabotage = (event: Event) => {
      sendSabotage((event as CustomEvent).detail.sabotageType);
    };
    window.addEventListener("sudocidio:sendSabotage", handleSendSabotage);
    return () => window.removeEventListener("sudocidio:sendSabotage", handleSendSabotage);
  }, [sendSabotage]);

  useEffect(() => {
    const handleVictory = (event: Event) => {
      const data = (event as CustomEvent).detail;
      accuse(true);
      setGameOverData({
        reason: "victory",
        murderer: data.murderer,
        weapon: data.weapon,
        room: data.room,
        elapsedTime: INITIAL_TIME - time,
      });
      setIsGameOver(true);
    };
    window.addEventListener("sudocidio:victory", handleVictory);
    return () => window.removeEventListener("sudocidio:victory", handleVictory);
  }, [time, accuse]);

  useEffect(() => {
    if (isGameOver) return;
    const timer = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          setGameOverData({ reason: "time_up", elapsedTime: INITIAL_TIME });
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

  const handlePlayAgain = useCallback(() => {
    setIsGameOver(false);
    setGameOverData(null);
    setTime(INITIAL_TIME);
    setActiveClues([]);
    setCurrentProgress(0);
    setOpponentProgress(0);
    resetMatch();
    findMatch();
  }, [findMatch, resetMatch]);

  const handleGoHome = useCallback(() => {
    resetMatch();
    router.push("/");
  }, [router, resetMatch]);

  useEffect(() => {
    findMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
    
    // inside GamePageInner, in the useEffect that calls findMatch():
      useEffect(() => {
        findMatch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

  if (matchStatus === "WAITING") {
    return (
      <main className="h-screen w-screen flex items-center justify-center bg-wood-900 scanlines">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "url('/assets/floor/wooden.png')",
            backgroundRepeat: "repeat",
            backgroundSize: "64px 64px",
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-6 text-cream-100">
          <div
            className="w-16 h-16 rounded-full border-4 border-cream-300/30"
            style={{ borderTopColor: "#c94a4a", animation: "spin 1s linear infinite" }}
          />
          <p className="text-xl tracking-widest uppercase font-bold" style={{ textShadow: "1px 1px 0 #2d1b0e" }}>
            Aguardando oponente...
          </p>
          <p className="text-xs text-cream-300/60 tracking-widest">
            Compartilhe a URL para jogar com um amigo
          </p>
          <button
            onClick={handleGoHome}
            className="mt-4 px-6 py-2 border-2 border-wood-500 text-wood-300 text-xs uppercase tracking-widest hover:border-blood-400 hover:text-blood-400 transition-colors"
          >
            Cancelar
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen flex flex-col bg-wood-900 overflow-hidden scanlines">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: "url('/assets/floor/wooden.png')",
          backgroundRepeat: "repeat",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="relative z-50">
        <TopBar time={formatTime(time)} />
      </div>

      <div key={matchId} className="flex-1 flex gap-2 p-2 min-h-0 relative z-10">
        <div className="w-52 flex flex-col gap-2 flex-shrink-0">
          <div className="flex-1 min-h-0">
            <CluesPanel clues={activeClues} />
          </div>
          <div className="flex-1 min-h-0">
            <PiecesPanel suspects={gameSuspects} weapons={gameWeapons} />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-center">
          <PhaserMapWrapper seed={activeSeed} />
        </div>

        <div className="w-48 flex flex-col gap-2 flex-shrink-0">
          <SabotagePanel />
          <OpponentPreview
            progress={opponentProgress}
            total={12}
            opponentPieces={[]}
          />
          <AccusationButton disabled={isGameOver} />
        </div>
      </div>

      {/* 👇 únicas 2 props novas — tudo mais idêntico ao original */}
      <GameOverModal
        isOpen={isGameOver}
        data={gameOverData}
        productId={FEIRA_PRODUCT_ID}
        creditValue={FEIRA_CREDIT_VALUE}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
      />
    </main>
  );
}

export default function GamePage() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <GamePageInner />
      </WebSocketProvider>
    </AuthProvider>
  );
}