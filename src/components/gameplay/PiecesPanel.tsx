"use client";

import { useState, useEffect } from "react";
import { GripVertical, User, Wrench } from "lucide-react";
import Image from "next/image";

interface Suspect { id: string; name: string; color: string; colorClass: string; sprite: string; }
interface Weapon { id: string; name: string; icon: string; }
interface PiecesPanelProps { suspects: Suspect[]; weapons: Weapon[]; }

export function PiecesPanel({ suspects, weapons }: PiecesPanelProps) {
  // Guarda quem já foi colocado no mapa
  const [placedPieces, setPlacedPieces] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handlePlaced = (e: Event) => setPlacedPieces(prev => new Set(prev).add((e as CustomEvent).detail.name));
    const handleRemoved = (e: Event) => setPlacedPieces(prev => {
      const next = new Set(prev);
      next.delete((e as CustomEvent).detail.name);
      return next;
    });

    window.addEventListener('sudocidio:piecePlaced', handlePlaced);
    window.addEventListener('sudocidio:pieceRemoved', handleRemoved);
    return () => {
      window.removeEventListener('sudocidio:piecePlaced', handlePlaced);
      window.removeEventListener('sudocidio:pieceRemoved', handleRemoved);
    }
  }, []);

  // Lógica de empacotar a peça (Padrão exato da Sofia)
  const handleDragStart = (e: React.DragEvent, type: "suspect" | "weapon", name: string) => {
    const payload = {
      sourceType: 'panel',
      entityId: name,
      entityType: type
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header flex items-center gap-2">
        <GripVertical className="w-3 h-3 text-cream-300" />
        <span>Peças</span>
      </div>
      
      <div className="flex-1 p-2 overflow-y-auto space-y-3 custom-scroll">
        
        {/* Suspects Section */}
        <div>
          <h4 className="text-[6px] uppercase tracking-wider text-wood-300 mb-2 flex items-center gap-1">
            <User className="w-2.5 h-2.5" /> Suspeitos
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {suspects.map((suspect) => {
              const isPlaced = placedPieces.has(suspect.name);
              return (
                <div
                  key={suspect.id}
                  draggable={!isPlaced}
                  onDragStart={(e) => handleDragStart(e, "suspect", suspect.name)}
                  className={`piece ${suspect.colorClass} p-1.5 flex items-center gap-1.5 transition-all ${
                    isPlaced ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center relative" style={{ backgroundColor: suspect.color }}>
                    <Image src={suspect.sprite} alt={suspect.name} width={24} height={24} className="object-contain pixelated" style={{ imageRendering: "pixelated" }} />
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
              return (
                <div
                  key={weapon.id}
                  draggable={!isPlaced}
                  onDragStart={(e) => handleDragStart(e, "weapon", weapon.name)}
                  className={`piece p-1.5 flex items-center gap-1.5 transition-all ${
                    isPlaced ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-wood-700/50 rounded">
                    <Image src={weapon.icon} alt={weapon.name} width={24} height={24} className="object-contain" style={{ imageRendering: "pixelated" }} />
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