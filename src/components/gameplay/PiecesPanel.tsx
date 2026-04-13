"use client";

import { GripVertical, User, Wrench } from "lucide-react";
import Image from "next/image";

interface Suspect {
  id: string;
  name: string;
  color: string;
  colorClass: string;
  sprite: string;
}

interface Weapon {
  id: string;
  name: string;
  icon: string;
}

interface PiecesPanelProps {
  suspects: Suspect[];
  weapons: Weapon[];
  onDragStart?: (type: "suspect" | "weapon", id: string) => void;
}

export function PiecesPanel({ suspects, weapons, onDragStart }: PiecesPanelProps) {
  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header flex items-center gap-2">
        <GripVertical className="w-3 h-3 text-cream-300" />
        <span>Pecas</span>
      </div>
      
      <div className="flex-1 p-2 overflow-y-auto space-y-3">
        {/* Suspects Section */}
        <div>
          <h4 className="text-[6px] uppercase tracking-wider text-wood-300 mb-2 flex items-center gap-1">
            <User className="w-2.5 h-2.5" />
            Suspeitos
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {suspects.map((suspect) => (
              <div
                key={suspect.id}
                draggable
                onDragStart={() => onDragStart?.("suspect", suspect.id)}
                className={`piece ${suspect.colorClass} p-1.5 flex items-center gap-1.5 cursor-grab active:cursor-grabbing`}
              >
                <div
                  className="w-8 h-8 flex items-center justify-center relative"
                  style={{ backgroundColor: suspect.color }}
                >
                  <Image
                    src={suspect.sprite}
                    alt={suspect.name}
                    width={24}
                    height={24}
                    className="object-contain pixelated"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
                <span className="text-[6px] truncate text-cream-100">{suspect.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weapons Section */}
        <div>
          <h4 className="text-[6px] uppercase tracking-wider text-wood-300 mb-2 flex items-center gap-1">
            <Wrench className="w-2.5 h-2.5" />
            Armas
          </h4>
          <div className="grid grid-cols-2 gap-1.5">
            {weapons.map((weapon) => (
              <div
                key={weapon.id}
                draggable
                onDragStart={() => onDragStart?.("weapon", weapon.id)}
                className="piece p-1.5 flex items-center gap-1.5 cursor-grab active:cursor-grabbing"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-wood-700/50 rounded">
                  <Image
                    src={weapon.icon}
                    alt={weapon.name}
                    width={24}
                    height={24}
                    className="object-contain"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>
                <span className="text-[6px] truncate text-cream-100">{weapon.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
