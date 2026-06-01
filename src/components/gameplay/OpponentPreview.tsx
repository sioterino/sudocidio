"use client";

import { Users, AlertCircle } from "lucide-react";
import { useEffect, useRef } from "react";

interface OpponentPreviewProps {
  progress: number;
  total: number;
  opponentPieces?: { row: number; col: number }[];
  miniGridSize?: { rows: number; cols: number };
}

export function OpponentPreview({
  progress,
  total,
  opponentPieces = [],
  miniGridSize = { rows: 5, cols: 7 },
}: OpponentPreviewProps) {
  const progressPercentage = Math.min((progress / total) * 100, 100);
  const totalCells = miniGridSize.rows * miniGridSize.cols;

  // Distribui as células preenchidas de forma determinística pelo progresso
  // (sem revelar posições reais — é visão limitada propositalmente)
  const filledCells = Math.round((progress / total) * totalCells);

  // Gera índices embaralhados deterministicamente a partir do progresso
  // para que as células apareçam em ordem "aleatória mas estável"
  const shuffledIndices = useRef<number[]>([]);
  useEffect(() => {
    const indices = Array.from({ length: totalCells }, (_, i) => i);
    // Embaralhamento determinístico (Fisher-Yates com seed fixa)
    let seed = 42;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0xffffffff;
    };
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    shuffledIndices.current = indices;
  }, [totalCells]);

  const filledSet = new Set(shuffledIndices.current.slice(0, filledCells));

  // Cor da barra muda conforme o perigo
  const barColor =
    progressPercentage >= 80
      ? "#c94a4a" // vermelho — oponente quase venceu
      : progressPercentage >= 50
        ? "#d4874d" // laranja — atenção
        : "#4d9a4d"; // verde — calmo

  const isAhead = progress > 0;

  return (
    <div className="panel flex flex-col flex-1">
      <div className="panel-header flex items-center gap-2">
        <Users
          className="w-3 h-3"
          style={{ color: progressPercentage >= 80 ? "#c94a4a" : "#a0856a" }}
        />
        <span>Adversario</span>
        {progressPercentage >= 80 && (
          <span className="ml-auto text-[5px] uppercase tracking-widest text-blood-400 animate-pulse">
            perigo!
          </span>
        )}
      </div>

      <div className="p-2 space-y-2 flex-1 flex flex-col">
        {/* Barra de Tensão */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[6px]">
            <span className="text-wood-400 uppercase tracking-wider">Progresso</span>
            <span className="font-bold" style={{ color: barColor }}>
              {total > 0 ? Math.round((progress / total) * 100) : 0}%
            </span>
          </div>

          {/* Trilho da barra */}
          <div
            className="relative h-2 w-full bg-wood-900/60"
            style={{ boxShadow: "inset 0 0 0 1px #4a2f18" }}
          >
            {/* Preenchimento animado */}
            <div
              className="absolute inset-y-0 left-0 transition-all duration-500"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: barColor,
                boxShadow: isAhead ? `0 0 6px ${barColor}88` : undefined,
              }}
            />
            {/* Pulso quando avança */}
            {isAhead && (
              <div
                className="absolute inset-y-0 left-0 opacity-30 animate-pulse"
                style={{
                  width: `${progressPercentage}%`,
                  backgroundColor: barColor,
                }}
              />
            )}
          </div>
        </div>

        {/* Mini Grade — Visão Limitada */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-1 mb-1.5">
            <AlertCircle className="w-2.5 h-2.5 text-wood-500" />
            <span className="text-[5px] text-wood-500 uppercase tracking-wider">
              Visao Limitada
            </span>
          </div>

          <div
            className="flex-1 flex items-center justify-center bg-wood-900/40 p-2"
            style={{ boxShadow: "inset 0 0 0 2px #4a2f18" }}
          >
            <div
              className="grid gap-px"
              style={{
                gridTemplateColumns: `repeat(${miniGridSize.cols}, 1fr)`,
                gridTemplateRows: `repeat(${miniGridSize.rows}, 1fr)`,
              }}
            >
              {Array.from({ length: totalCells }).map((_, index) => {
                const hasPiece = filledSet.has(index);
                return (
                  <div
                    key={index}
                    className="w-2.5 h-2.5 transition-colors duration-300"
                    style={
                      hasPiece
                        ? {
                          backgroundColor: barColor,
                          boxShadow: `0 0 4px ${barColor}88`,
                        }
                        : { backgroundColor: "rgba(74, 47, 24, 0.4)" }
                    }
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}