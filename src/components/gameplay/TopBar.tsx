"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Settings, X, Home, Volume2, VolumeX, HelpCircle } from "lucide-react";

interface TopBarProps {
  time: string;
}

export function TopBar({ time }: TopBarProps) {
  const router = useRouter();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Handle ESC key to close dialog
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && isOptionsOpen) {
      setIsOptionsOpen(false);
    }
  }, [isOptionsOpen]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleReturnToMenu = () => {
    setIsOptionsOpen(false);
    router.push("/");
  };

  return (
    <>
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

        {/* Options Button */}
        <button
          onClick={() => setIsOptionsOpen(true)}
          className="action-btn flex items-center gap-2 px-4 py-2"
        >
          <Settings className="w-4 h-4" />
          <span>Opcoes</span>
        </button>
      </header>

      {/* Options Dialog Overlay */}
      {isOptionsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsOptionsOpen(false)}
          />
          
          {/* Dialog Panel */}
          <div className="relative z-10 w-80 bg-gradient-to-b from-wood-700 to-wood-800 border-4 border-wood-500 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-wood-600">
              <h2 
                className="text-lg text-cream-200 tracking-wider"
                style={{ textShadow: "1px 1px 0 #2d1b0e" }}
              >
                OPCOES
              </h2>
              <button
                onClick={() => setIsOptionsOpen(false)}
                className="w-8 h-8 flex items-center justify-center bg-wood-600 hover:bg-blood-600 transition-colors border-2 border-wood-500"
              >
                <X className="w-4 h-4 text-cream-200" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Sound Toggle */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-wood-600/50 hover:bg-wood-600 border-2 border-wood-500 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-cream-300" />
                ) : (
                  <Volume2 className="w-5 h-5 text-cream-300" />
                )}
                <span className="text-sm text-cream-200">
                  {isMuted ? "Som Desativado" : "Som Ativado"}
                </span>
              </button>

              {/* Help */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 bg-wood-600/50 hover:bg-wood-600 border-2 border-wood-500 transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-cream-300" />
                <span className="text-sm text-cream-200">Como Jogar</span>
              </button>

              {/* Divider */}
              <div className="h-1 bg-gradient-to-r from-transparent via-wood-500 to-transparent my-2" />

              {/* Return to Menu Button */}
              <button
                onClick={handleReturnToMenu}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blood-700 hover:bg-blood-600 border-2 border-blood-500 transition-colors"
              >
                <Home className="w-5 h-5 text-cream-100" />
                <span className="text-sm text-cream-100 font-semibold">Retornar ao Menu</span>
              </button>
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t-2 border-wood-600 bg-wood-800/50">
              <p className="text-[8px] text-cream-300/50 text-center">
                Pressione ESC para fechar
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
