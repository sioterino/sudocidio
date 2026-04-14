"use client";

import { AlertTriangle } from "lucide-react";

interface AccusationButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

export function AccusationButton({ onClick, disabled }: AccusationButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative overflow-hidden
        w-full py-3 px-4
        bg-gradient-to-b from-blood-400 to-blood-600
        border-4 border-blood-500
        text-[8px] uppercase tracking-widest
        text-cream-100
        transition-all duration-200
        hover:from-blood-500 hover:to-blood-400
        hover:scale-[1.02]
        active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        group
      `}
      style={{
        boxShadow: `
          inset -3px -3px 0 0 #8b2e2e,
          inset 3px 3px 0 0 #c94a4a,
          0 4px 0 0 #4a1f1f,
          0 6px 8px rgba(0, 0, 0, 0.4)
        `,
      }}
    >
      {/* Content */}
      <div className="relative flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 animate-pulse" />
        <span>Acusacao</span>
        <AlertTriangle className="w-4 h-4 animate-pulse" />
      </div>

      {/* Pixel glow border */}
      <div 
        className="absolute inset-0 border-2 border-cream-300/30 animate-pulse pointer-events-none"
      />
    </button>
  );
}
