"use client";

import { useState } from "react";

interface Room {
  id: string;
  name: string;
  color: string;
  cells: { row: number; col: number }[];
}

interface PlacedPiece {
  row: number;
  col: number;
  type: "suspect" | "weapon" | "clue";
  id: string;
  label?: string;
  color?: string;
}

interface MansionGridProps {
  rooms: Room[];
  placedPieces: PlacedPiece[];
  gridSize?: { rows: number; cols: number };
  onCellDrop?: (row: number, col: number) => void;
}

export function MansionGrid({
  rooms,
  placedPieces,
  gridSize = { rows: 7, cols: 10 },
  onCellDrop,
}: MansionGridProps) {
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  // Create a map of cell positions to room info
  const cellRoomMap = new Map<string, Room>();
  rooms.forEach((room) => {
    room.cells.forEach((cell) => {
      cellRoomMap.set(`${cell.row}-${cell.col}`, room);
    });
  });

  // Create a map of placed pieces
  const placedPiecesMap = new Map<string, PlacedPiece>();
  placedPieces.forEach((piece) => {
    placedPiecesMap.set(`${piece.row}-${piece.col}`, piece);
  });

  const handleDragOver = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    setHoveredCell({ row, col });
  };

  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    setHoveredCell(null);
    onCellDrop?.(row, col);
  };

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header flex items-center justify-between">
        <span className="flex items-center gap-2">
          <svg className="w-3 h-3 text-cream-300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          Mapa da Mansao
        </span>
        <span className="text-[5px] text-wood-400">Arraste as pecas</span>
      </div>

      <div className="flex-1 p-3 flex items-center justify-center overflow-auto">
        <div className="relative">
          {/* Room Labels */}
          {rooms.map((room) => {
            const centerRow = room.cells.reduce((sum, c) => sum + c.row, 0) / room.cells.length;
            const centerCol = room.cells.reduce((sum, c) => sum + c.col, 0) / room.cells.length;
            return (
              <div
                key={room.id}
                className="absolute pointer-events-none z-10 text-[5px] font-bold uppercase tracking-wider"
                style={{
                  top: `${centerRow * 36 + 8}px`,
                  left: `${centerCol * 36 + 4}px`,
                  color: room.color,
                  textShadow: "1px 1px 0 #2d1b0e",
                }}
              >
                {room.name}
              </div>
            );
          })}

          {/* Grid */}
          <div
            className="grid gap-0.5 p-2 bg-wood-900/60"
            style={{
              gridTemplateColumns: `repeat(${gridSize.cols}, 32px)`,
              gridTemplateRows: `repeat(${gridSize.rows}, 32px)`,
              boxShadow: "inset 0 0 0 3px #4a2f18, inset 0 0 0 6px #2d1b0e",
            }}
          >
            {Array.from({ length: gridSize.rows * gridSize.cols }).map((_, index) => {
              const row = Math.floor(index / gridSize.cols);
              const col = index % gridSize.cols;
              const cellKey = `${row}-${col}`;
              const room = cellRoomMap.get(cellKey);
              const piece = placedPiecesMap.get(cellKey);
              const isHovered = hoveredCell?.row === row && hoveredCell?.col === col;

              return (
                <div
                  key={cellKey}
                  className={`grid-cell relative flex items-center justify-center ${
                    isHovered ? "droppable" : ""
                  }`}
                  style={{
                    backgroundColor: room ? `${room.color}30` : "rgba(45, 27, 14, 0.4)",
                    borderColor: room ? `${room.color}50` : undefined,
                  }}
                  onDragOver={(e) => handleDragOver(e, row, col)}
                  onDragLeave={() => setHoveredCell(null)}
                  onDrop={(e) => handleDrop(e, row, col)}
                >
                  {piece && (
                    <div
                      className={`w-6 h-6 flex items-center justify-center text-[7px] font-bold ${
                        piece.type === "clue" ? "opacity-50 border border-dashed border-cream-200/40" : ""
                      }`}
                      style={{
                        backgroundColor: piece.color || "#6b4423",
                        color: "#2d1b0e",
                        boxShadow: "inset -1px -1px 0 0 rgba(0,0,0,0.3), inset 1px 1px 0 0 rgba(255,255,255,0.2)",
                      }}
                    >
                      {piece.label || piece.id.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
