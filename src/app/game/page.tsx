"use client";

// importa códigos prontos e ferramentas de outros arquivos do projeto
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

// cria posições falsas só pra testar visualmente a barra do adversário
const opponentPieces = [
  { row: 0, col: 2 }, { row: 1, col: 4 }, { row: 2, col: 6 }, { row: 3, col: 1 },
];

// monta a tela completa onde a partida acontece
export default function GamePage() {
  // ferramenta pra conseguir trocar de página dps
  const router = useRouter();
  
  // tempo de duração da partida em segundos
  const INITIAL_TIME = 180;
  
  // useState serve como a memória da página. qnd essas memórias mudam, a página se desenha de novo sozinha
  // memória do cronômetro
  const [time, setTime] = useState(INITIAL_TIME);
  // memória q lista as dicas na tela
  const [activeClues, setActiveClues] = useState<ClueData[]>([]);
  
  // controla o número da partida. mudar ele faz a página deletar tudo e começar um novo jogo do zero
  const [matchId, setMatchId] = useState(0);
  
  // guardam as informações dos suspeitos e armas enviados pelo motor gráfico
  const [gameSuspects, setGameSuspects] = useState<any[]>([]);
  const [gameWeapons, setGameWeapons] = useState<any[]>([]);
  
  // memorizam se a partida acabou e os detalhes do vencedor pra mostrar na tela final
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverData, setGameOverData] = useState<{
    reason: GameOverReason;
    murderer?: string;
    weapon?: string;
    room?: string;
    opponentName?: string;
    elapsedTime?: number;
  } | null>(null);

  // useEffect cria escutas pra perceber qnd o motor gráfico do jogo faz algo importante
  useEffect(() => {
    // anota uma nova dica na memória qnd o jogo manda
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

    // organiza os dados dos suspeitos e armas assim q o mapa termina de carregar
    const handleEntities = (event: Event) => {
      const data = (event as CustomEvent).detail;
      
      // apaga dicas antigas
      setActiveClues([]); 
      
      // distribui uma cor diferente pra cada personagem gerado
      const colors = ["#c94a4a", "#d4874d", "#d4b34d", "#4d9a4d", "#4d9a9a", "#8b4d8b"];
      const colorClasses = ["suspect-a", "suspect-b", "suspect-c", "suspect-d", "suspect-e", "suspect-f"];
      
      // arruma os dados pra um formato mais fácil da tela entender
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

      // salva tudo na memória da tela
      setGameSuspects(mappedSuspects);
      setGameWeapons(mappedWeapons);
    };

    // liga as escutas de fato
    window.addEventListener("sudocidio:newHint", handleNewHint);
    window.addEventListener("sudocidio:entitiesGenerated", handleEntities);

    // desliga as escutas qnd a tela fecha pra n usar internet ou processador atoa
    return () => {
      window.removeEventListener("sudocidio:newHint", handleNewHint);
      window.removeEventListener("sudocidio:entitiesGenerated", handleEntities);
    };
  }, []);

  // cria escutas focadas só em saber se a partida acabou
  useEffect(() => {
    // ativa a tela de vitória se o jogador acertar a acusação final
    const handleVictory = (event: Event) => {
      const data = (event as CustomEvent).detail;
      setGameOverData({
        reason: "victory",
        murderer: data.murderer,
        weapon: data.weapon,
        room: data.room,
        elapsedTime: INITIAL_TIME - time,
      });
      setIsGameOver(true);
    };

    // ativa a derrota se o outro jogador acertar primeiro
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

  // cria um cronômetro automático
  useEffect(() => {
    // n faz o relógio rodar se o jogo já terminou
    if (isGameOver) return; 
    
    // roda o bloco de código abaixo a cada 1 segundo
    const timer = setInterval(() => {
      setTime((prev) => {
        // ativa a tela de derrota se o tempo chegar no fim
        if (prev <= 1) {
          setGameOverData({ 
            reason: "time_up",
            elapsedTime: INITIAL_TIME,
          });
          setIsGameOver(true);
          return 0;
        }
        // diminui 1 segundo do tempo restante
        return prev - 1;
      });
    }, 1000);
    
    // joga o relógio fora qnd a tela é fechada
    return () => clearInterval(timer);
  }, [isGameOver]);

  // transforma o número puro de segundos num formato mais bonito tipo 05:22
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins.toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  // limpa tudo q ta salvo e prepara pra começar de novo qnd o botão jogar novamente é clicado
  const handlePlayAgain = () => {
    setIsGameOver(false);
    setGameOverData(null);
    setTime(INITIAL_TIME);
    setActiveClues([]);
    
    // somar 1 nessa memória força a área do jogo inteira a ser apagada e recriada
    setMatchId((prev) => prev + 1);
  };

  // manda a pessoa de volta pro menu principal
  const handleGoHome = () => {
    router.push("/");
  };

  // desenha as partes visuais na tela
  return (
    <main className="h-screen w-screen flex flex-col bg-wood-900 overflow-hidden scanlines">
      {/* imagem escura de textura de madeira no fundo */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "url('/assets/floor/wooden.png')", backgroundRepeat: "repeat", backgroundSize: "64px 64px" }} />

      {/* carrega a barrinha do topo com o relógio */}
      <div className="relative z-50">
        <TopBar time={formatTime(time)} />
      </div>

      {/* botar a key com a variável matchId faz esse quadrado todo ser deletado e desenhado de novo se a variável for atualizada */}
      <div key={matchId} className="flex-1 flex gap-2 p-2 min-h-0 relative z-10">
        
        {/* coluna da esquerda com caixas de pistas e suspeitos */}
        <div className="w-52 flex flex-col gap-2 flex-shrink-0">
          <div className="flex-1 min-h-0">
            <CluesPanel clues={activeClues} />
          </div>
          <div className="flex-1 min-h-0">
            <PiecesPanel suspects={gameSuspects} weapons={gameWeapons} />
          </div>
        </div>

        {/* centro da tela chamando o mapa jogável. passa um id falso qnd é pra gerar fases novas */}
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <PhaserMapWrapper seed={matchId > 0 ? Date.now().toString() : "1234"} />
        </div>

        {/* coluna da direita com sabotagens do inimigo e botão enorme de resolver caso */}
        <div className="w-48 flex flex-col gap-2 flex-shrink-0">
          <SabotagePanel />
          <OpponentPreview progress={7} total={12} opponentPieces={opponentPieces} />
          <AccusationButton disabled={isGameOver} />
        </div>
      </div>

      {/* chama a janela escondida q só pula na tela qnd dá game over */}
      <GameOverModal
        isOpen={isGameOver}
        data={gameOverData}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
      />
    </main>
  );
}