"use client";

// Importe o novo componente que você acabou de criar!
import { OptionsMenu } from "./OptionsMenu"; 

interface TopBarProps {
  time: string;
}

export function TopBar({ time }: TopBarProps) {
  return (
    <header className="h-16 bg-gradient-to-b from-wood-700 to-wood-800 border-b-4 border-wood-900 flex items-center justify-between px-4 pixel-border-dark">
      {/* Timer */}
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 bg-blood-500 animate-pulse" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
        <div className="flex flex-col">
          <span className="text-[6px] text-wood-300 uppercase tracking-widest">Tempo</span>
          <span className="text-sm text-cream-100 tracking-wider">{time}</span>
        </div>
      </div>

      {/* Game Title */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
        <h1 
          className="text-lg text-cream-300 tracking-[0.15em] animate-pulse-slow"
          style={{ textShadow: "2px 2px 0 #2d1b0e, -1px -1px 0 #8b5a2b" }}
        >
          SUDOCIDIO
        </h1>
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-cream-300/50 to-transparent mt-1" />
      </div>

      {/* O botão e o modal agora estão encapsulados aqui! */}
      <OptionsMenu />
      
    </header>
  );
}