"use client";

import { Users, AlertCircle } from "lucide-react";

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
  const progressPercentage = (progress / total) * 100;
  const piecePositions = new Set(opponentPieces.map((p) => `${p.row}-${p.col}`));

  return (
    <div className="panel flex flex-col flex-1">
      <div className="panel-header flex items-center gap-2">
        <Users className="w-3 h-3 text-blood-400" />
        <span>Adversario</span>
      </div>

      <div className="p-2 space-y-2 flex-1 flex flex-col">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[6px]">
            <span className="text-wood-400 uppercase tracking-wider">Progresso</span>
            <span className="font-bold text-blood-400">
              {progress}/{total}
            </span>
          </div>
          <div className="progress-bar h-2">
            <div
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Mini Map Preview */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-1 mb-1.5">
            <AlertCircle className="w-2.5 h-2.5 text-wood-500" />
            <span className="text-[5px] text-wood-500 uppercase tracking-wider">
              Visao Limitada
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center bg-wood-900/40 p-2" style={{ boxShadow: "inset 0 0 0 2px #4a2f18" }}>
            <div
              className="grid gap-px"
              style={{
                gridTemplateColumns: `repeat(${miniGridSize.cols}, 1fr)`,
                gridTemplateRows: `repeat(${miniGridSize.rows}, 1fr)`,
              }}
            >
              {Array.from({ length: miniGridSize.rows * miniGridSize.cols }).map((_, index) => {
                const row = Math.floor(index / miniGridSize.cols);
                const col = index % miniGridSize.cols;
                const hasPiece = piecePositions.has(`${row}-${col}`);

                return (
                  <div
                    key={`${row}-${col}`}
                    className={`w-2.5 h-2.5 ${
                      hasPiece
                        ? "bg-blood-500"
                        : "bg-wood-700/40"
                    }`}
                    style={hasPiece ? { boxShadow: "0 0 4px rgba(166, 61, 61, 0.5)" } : undefined}
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
