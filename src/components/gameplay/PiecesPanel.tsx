"use client";

import { useState, useEffect } from "react";
import { GripVertical, User, Wrench } from "lucide-react";
import Image from "next/image";

interface Suspect { id: string; name: string; color: string; colorClass: string; sprite: string; role?: string; }
interface Weapon { id: string; name: string; icon: string; }
interface PiecesPanelProps { suspects: Suspect[]; weapons: Weapon[]; }

export function PiecesPanel({ suspects, weapons }: PiecesPanelProps) {
  const [placedPieces, setPlacedPieces] = useState<Set<string>>(new Set());
  const [boardLocked, setBoardLocked] = useState(false);

  useEffect(() => {
    const handlePlaced = (e: Event) =>
      setPlacedPieces(prev => new Set(prev).add((e as CustomEvent).detail.name));

    const handleRemoved = (e: Event) =>
      setPlacedPieces(prev => {
        const next = new Set(prev);
        next.delete((e as CustomEvent).detail.name);
        return next;
      });

    // Ouve o lock/unlock do tabuleiro (disparado pelo LOCK do Phaser)
    const handleBoardLocked = (e: Event) =>
      setBoardLocked((e as CustomEvent).detail.locked as boolean);

    window.addEventListener('sudocidio:piecePlaced', handlePlaced);
    window.addEventListener('sudocidio:pieceRemoved', handleRemoved);
    window.addEventListener('sudocidio:boardLocked', handleBoardLocked);

    return () => {
      window.removeEventListener('sudocidio:piecePlaced', handlePlaced);
      window.removeEventListener('sudocidio:pieceRemoved', handleRemoved);
      window.removeEventListener('sudocidio:boardLocked', handleBoardLocked);
    };
  }, []);

  const handleDragStart = (e: React.DragEvent, type: string, name: string) => {
    // Se o tabuleiro estiver travado, cancela o drag imediatamente
    if (boardLocked) {
      e.preventDefault();
      return;
    }
    const payload = { sourceType: 'panel', entityId: name, entityType: type };
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header flex items-center gap-2">
        <GripVertical className="w-3 h-3 text-cream-300" />
        <span>Peças</span>
        {/* Indicador visual de lock no header */}
        {boardLocked && (
          <span
            className="ml-auto text-[6px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm"
            style={{
              background: 'rgba(168,159,212,0.15)',
              color: '#a89fd4',
              border: '1px solid rgba(168,159,212,0.3)',
              fontFamily: '"Courier New", monospace',
            }}
          >
            TRAVADO
          </span>
        )}
      </div>

      <div
        className="flex-1 p-2 overflow-y-auto space-y-3 custom-scroll"
        style={{
          // Feedback visual sutil quando travado
          opacity: boardLocked ? 0.5 : 1,
          transition: 'opacity 0.25s ease',
          pointerEvents: boardLocked ? 'none' : 'auto',
        }}
      >
        {/* Suspects Section */}
        <div>
          <h4 className="text-[6px] uppercase tracking-wider text-wood-300 mb-2 flex items-center gap-1">
            <User className="w-2.5 h-2.5" /> Envolvidos
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {suspects.map((suspect) => {
              const isPlaced = placedPieces.has(suspect.name);
              const isDisabled = isPlaced || boardLocked;
              return (
                <div
                  key={suspect.id}
                  draggable={!isDisabled}
                  onDragStart={(e) => handleDragStart(e, suspect.role || "suspect", suspect.name)}
                  className={`piece ${suspect.colorClass} p-1.5 flex items-center gap-1.5 transition-all ${
                    isDisabled ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center relative" style={{ backgroundColor: suspect.color }}>
                    <Image
                      src={suspect.sprite}
                      alt={suspect.name}
                      width={24} height={24}
                      className="object-contain pixelated"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <span className="text-[6px] truncate text-cream-100">{suspect.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weapons Section */}
        <div>
          <h4 className="text-[6px] uppercase tracking-wider text-wood-300 mb-2 flex items-center gap-1">
            <Wrench className="w-2.5 h-2.5" /> Armas
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {weapons.map((weapon) => {
              const isPlaced = placedPieces.has(weapon.name);
              const isDisabled = isPlaced || boardLocked;
              return (
                <div
                  key={weapon.id}
                  draggable={!isDisabled}
                  onDragStart={(e) => handleDragStart(e, "weapon", weapon.name)}
                  className={`piece p-1.5 flex items-center gap-1.5 transition-all ${
                    isDisabled ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-wood-700/50 rounded">
                    <Image
                      src={weapon.icon}
                      alt={weapon.name}
                      width={24} height={24}
                      className="object-contain"
                      style={{ imageRendering: "pixelated" }}
                    />
                  </div>
                  <span className="text-[6px] truncate text-cream-100">{weapon.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}