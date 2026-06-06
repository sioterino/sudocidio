"use client";

import { useEffect, useState } from "react";
import { Trophy, Skull, Clock, Users, RotateCcw, Home } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export type GameOverReason = "victory" | "time_up" | "opponent_won";

interface GameOverData {
  reason: GameOverReason;
  murderer?: string;
  weapon?: string;
  room?: string;
  opponentName?: string;
  elapsedTime?: number;
}

interface GameOverModalProps {
  isOpen: boolean;
  data: GameOverData | null;
  /** ID do produto cadastrado na Feira de Jogos */
  productId: number;
  /** Crédito em tijolinhos — só creditado em vitória */
  creditValue: number;
  onPlayAgain?: () => void;
  onGoHome?: () => void;
}

type CreditStatus = "idle" | "loading" | "success" | "error";

const FEIRA_API_URL = "https://feira-de-jogos.dev.br/api/v2/credit";

export function GameOverModal({
  isOpen,
  data,
  productId,
  creditValue,
  onPlayAgain,
  onGoHome,
}: GameOverModalProps) {
  const { token } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [creditStatus, setCreditStatus] = useState<CreditStatus>("idle");

  useEffect(() => {
    if (isOpen) {
      const timer1 = setTimeout(() => setShowContent(true), 300);
      const timer2 = setTimeout(() => setShowDetails(true), 800);
      // Credita automaticamente ao abrir se for vitória e tiver token
      if (data?.reason === "victory" && token) {
        handleCredit(token);
      }
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      setShowContent(false);
      setShowDetails(false);
      setCreditStatus("idle");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  async function handleCredit(authToken: string) {
    setCreditStatus("loading");
    try {
      const response = await fetch(FEIRA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ product: productId, value: creditValue }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setCreditStatus("success");
    } catch (error) {
      console.error("Erro ao adicionar crédito:", error);
      setCreditStatus("error");
    }
  }

  if (!isOpen || !data) return null;

  const isVictory = data.reason === "victory";

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTitle = () => {
    switch (data.reason) {
      case "victory": return "CASO ENCERRADO";
      case "time_up": return "TEMPO ESGOTADO";
      case "opponent_won": return "CASO RESOLVIDO";
      default: return "FIM DE JOGO";
    }
  };

  const getSubtitle = () => {
    switch (data.reason) {
      case "victory": return "Parabens, Detetive! Voce desvendou o misterio!";
      case "time_up": return "O assassino escapou... O caso ficara sem solucao.";
      case "opponent_won": return `${data.opponentName || "Seu oponente"} resolveu o caso primeiro!`;
      default: return "";
    }
  };

  const getIcon = () => {
    switch (data.reason) {
      case "victory":
        return <Trophy className="w-16 h-16 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />;
      case "time_up":
        return <Clock className="w-16 h-16 text-blood-400 drop-shadow-[0_0_15px_rgba(201,74,74,0.5)]" />;
      case "opponent_won":
        return <Users className="w-16 h-16 text-blood-400 drop-shadow-[0_0_15px_rgba(201,74,74,0.5)]" />;
      default:
        return <Skull className="w-16 h-16 text-blood-400" />;
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 99999 }}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-all duration-700 ${
          isVictory
            ? "bg-gradient-to-b from-yellow-900/90 via-black/95 to-black/95"
            : "bg-gradient-to-b from-blood-600/40 via-black/95 to-black/95"
        }`}
      />

      {/* Partículas de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isVictory ? (
          [...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${2 + Math.random() * 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(139,46,46,0.3)_100%)]" />
        )}
      </div>

      {/* Conteúdo */}
      <div
        className={`relative flex flex-col items-center p-4 sm:p-6 max-w-md w-full mx-4 max-h-[95vh] overflow-y-auto transition-all duration-500 ${
          showContent ? "opacity-100 scale-100" : "opacity-0 scale-90"
        }`}
      >
        {/* Moldura superior */}
        <div
          className={`absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-2 ${
            isVictory ? "bg-yellow-500" : "bg-blood-500"
          }`}
          style={{
            clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)",
            boxShadow: isVictory
              ? "0 0 20px rgba(234, 179, 8, 0.6)"
              : "0 0 20px rgba(166, 61, 61, 0.6)",
          }}
        />

        {/* Painel */}
        <div
          className="relative bg-gradient-to-b from-wood-700 to-wood-900 border-4 p-5 sm:p-6 w-full"
          style={{
            borderColor: isVictory ? "#ca8a04" : "#8b2e2e",
            boxShadow: `
              inset -4px -4px 0 0 #2d1b0e,
              inset 4px 4px 0 0 #6b4423,
              0 0 40px ${isVictory ? "rgba(234, 179, 8, 0.3)" : "rgba(139, 46, 46, 0.4)"},
              0 20px 50px rgba(0, 0, 0, 0.8)
            `,
          }}
        >
          {/* Ícone */}
          <div className="flex justify-center mb-3">
            <div
              className={`p-3 rounded-full ${
                isVictory
                  ? "bg-gradient-to-b from-yellow-600/30 to-yellow-900/30 border-2 border-yellow-500/50"
                  : "bg-gradient-to-b from-blood-600/30 to-blood-900/30 border-2 border-blood-500/50"
              }`}
            >
              {getIcon()}
            </div>
          </div>

          {/* Título */}
          <h1
            className={`text-2xl sm:text-3xl text-center font-bold tracking-[0.15em] sm:tracking-[0.2em] mb-1 ${
              isVictory ? "text-yellow-400" : "text-blood-400"
            }`}
            style={{
              textShadow: isVictory
                ? "2px 2px 0 #854d0e, 0 0 20px rgba(250, 204, 21, 0.5)"
                : "2px 2px 0 #4a1f1f, 0 0 20px rgba(201, 74, 74, 0.5)",
            }}
          >
            {getTitle()}
          </h1>

          {/* Subtítulo */}
          <p className="text-center text-cream-200 text-xs sm:text-sm mb-4 tracking-wide">
            {getSubtitle()}
          </p>

          {/* Detalhes */}
          <div
            className={`transition-all duration-500 overflow-hidden ${
              showDetails ? "opacity-100 max-h-[600px]" : "opacity-0 max-h-0"
            }`}
          >
            {(data.murderer || data.weapon || data.room) && (
              <div className="bg-black/40 border-2 border-wood-600 p-3 mb-4">
                <h3 className="text-[9px] sm:text-[10px] text-wood-300 uppercase tracking-widest text-center mb-2">
                  A Solucao do Caso
                </h3>
                <div className="space-y-1.5">
                  {data.murderer && (
                    <div className="grid grid-cols-[auto_1fr] items-center gap-x-3">
                      <div className="flex items-center gap-2">
                        <Skull className="w-4 h-4 text-blood-400 flex-shrink-0" />
                        <span className="text-[10px] text-wood-400 uppercase tracking-wider">Assassino:</span>
                      </div>
                      <span className="text-sm text-cream-100 font-bold text-center">{data.murderer}</span>
                    </div>
                  )}
                  {data.weapon && (
                    <div className="grid grid-cols-[auto_1fr] items-center gap-x-3">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-blood-400">&#9876;</span>
                        <span className="text-[10px] text-wood-400 uppercase tracking-wider">Arma:</span>
                      </div>
                      <span className="text-sm text-cream-100 font-bold text-center">{data.weapon}</span>
                    </div>
                  )}
                  {data.room && (
                    <div className="grid grid-cols-[auto_1fr] items-center gap-x-3">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-blood-400">&#9632;</span>
                        <span className="text-[10px] text-wood-400 uppercase tracking-wider">Local:</span>
                      </div>
                      <span className="text-sm text-cream-100 font-bold text-center">{data.room}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tempo */}
            {data.elapsedTime !== undefined && (
              <div className="bg-black/30 border border-wood-600 p-2 mb-3 flex items-center justify-center gap-2">
                <Clock className={`w-4 h-4 ${isVictory ? "text-yellow-400" : "text-wood-400"}`} />
                <div className="text-center">
                  <span className="text-[8px] text-wood-400 uppercase tracking-wider block">Tempo de Resolucao</span>
                  <span className={`text-base font-bold tracking-widest ${isVictory ? "text-yellow-400" : "text-cream-200"}`}>
                    {formatElapsedTime(data.elapsedTime)}
                  </span>
                </div>
              </div>
            )}

            {/* Banner de crédito — só aparece em vitória */}
            {isVictory && (
              <div
                className={`mb-3 p-3 border-2 flex flex-col items-center gap-1 text-center transition-colors duration-300 ${
                  creditStatus === "success"
                    ? "bg-green-900/40 border-green-600"
                    : creditStatus === "error"
                    ? "bg-red-900/40 border-red-700"
                    : "bg-yellow-900/20 border-yellow-700/50"
                }`}
              >
                {creditStatus === "idle" && (
                  <p className="text-[10px] text-yellow-300 uppercase tracking-wider">
                    Creditando {creditValue} tijolinhos...
                  </p>
                )}
                {creditStatus === "loading" && (
                  <p className="text-[10px] text-yellow-300 uppercase tracking-wider animate-pulse">
                    Adicionando crédito...
                  </p>
                )}
                {creditStatus === "success" && (
                  <p className="text-[10px] text-green-400 uppercase tracking-wider">
                    ✓ +{creditValue} tijolinhos adicionados à sua conta!
                  </p>
                )}
                {creditStatus === "error" && (
                  <>
                    <p className="text-[10px] text-red-400 uppercase tracking-wider">
                      ✗ Erro ao adicionar crédito.
                    </p>
                    {token && (
                      <button
                        onClick={() => handleCredit(token)}
                        className="text-[9px] text-red-300 underline uppercase tracking-wider mt-1 hover:text-red-200"
                      >
                        Tentar novamente
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Botões */}
            <div className="flex flex-col gap-2">
              {onPlayAgain && (
                <button
                  onClick={onPlayAgain}
                  className={`
                    w-full py-2.5 px-4 flex items-center justify-center gap-2
                    text-[10px] sm:text-[11px] uppercase tracking-widest font-bold
                    transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
                    ${isVictory
                      ? "bg-gradient-to-b from-yellow-600 to-yellow-700 border-2 border-yellow-500 text-yellow-100 hover:from-yellow-500 hover:to-yellow-600"
                      : "bg-gradient-to-b from-wood-600 to-wood-700 border-2 border-wood-500 text-cream-100 hover:from-wood-500 hover:to-wood-600"
                    }
                  `}
                  style={{
                    boxShadow: "inset -2px -2px 0 0 rgba(0,0,0,0.3), inset 2px 2px 0 0 rgba(255,255,255,0.1), 0 3px 0 0 rgba(0,0,0,0.4)",
                  }}
                >
                  <RotateCcw className="w-4 h-4" />
                  Jogar Novamente
                </button>
              )}
              {onGoHome && (
                <button
                  onClick={onGoHome}
                  className="
                    w-full py-2.5 px-4 flex items-center justify-center gap-2
                    bg-gradient-to-b from-wood-700 to-wood-800 border-2 border-wood-600
                    text-[10px] sm:text-[11px] uppercase tracking-widest font-bold text-cream-300
                    transition-all duration-200 hover:from-wood-600 hover:to-wood-700
                    hover:scale-[1.02] active:scale-[0.98]
                  "
                  style={{
                    boxShadow: "inset -2px -2px 0 0 rgba(0,0,0,0.3), inset 2px 2px 0 0 rgba(255,255,255,0.05), 0 3px 0 0 rgba(0,0,0,0.4)",
                  }}
                >
                  <Home className="w-4 h-4" />
                  Menu Principal
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}