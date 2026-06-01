"use client";

import { useState } from "react";
import { Settings, Volume2, VolumeX, Flag, Minus, Plus } from "lucide-react";
import { useMusicPlayerContext } from "@/src/contexts/MusicPlayerContext";

export function OptionsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { changeVolume, toggleMute, isMuted, volume: playerVolume } = useMusicPlayerContext();

  const volume = Math.round(playerVolume * 100);

  const handleVolumeChange = (newVolume: number) => {
    changeVolume(newVolume / 100);
    // Usa o newVolume diretamente, não depende de isMuted no closure
    window.dispatchEvent(new CustomEvent('sudocidio:volumeChange', {
      detail: { volume: newVolume / 100 }
    }));
  };

  const handleToggleMute = () => {
    const willBeMuted = !isMuted;
    toggleMute();
    // Usa willBeMuted (valor futuro), não isMuted (valor atual do closure)
    window.dispatchEvent(new CustomEvent('sudocidio:volumeChange', {
      detail: { volume: willBeMuted ? 0 : volume / 100 }
    }));
  };

  const handleGiveUp = () => {
    window.location.href = "/";
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 bg-wood-800 border-2 border-wood-600 hover:bg-wood-700 hover:border-cream-300 transition-colors"
        title="Opções"
      >
        <Settings className="w-4 h-4 text-cream-100" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div
            className="bg-wood-900 border-4 border-wood-600 w-64 p-4 flex flex-col gap-4"
            style={{
              boxShadow: 'inset -2px -2px 0 0 #2a1610, inset 2px 2px 0 0 #5c3a21, 0 8px 16px rgba(0,0,0,0.8)',
              imageRendering: 'pixelated'
            }}
          >
            <div className="flex justify-between items-center border-b-2 border-wood-700 pb-2">
              <h2 className="text-[10px] uppercase tracking-widest text-cream-100 flex items-center gap-2">
                <Settings className="w-4 h-4" /> Configurações
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-wood-400 hover:text-blood-400 font-bold text-xs p-1"
              >
                X
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleToggleMute}
                className="flex items-center justify-between p-2 bg-wood-800 border border-wood-700 hover:border-wood-500 transition-colors group"
              >
                <span className="text-[8px] uppercase tracking-wider text-cream-300 group-hover:text-cream-100">
                  Música
                </span>
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-blood-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-green-400" />
                )}
              </button>

              <div className="flex flex-col gap-1.5 p-2 bg-wood-800 border border-wood-700">
                <span className="text-[8px] uppercase tracking-wider text-cream-300">
                  Volume Geral ({volume}%)
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => handleVolumeChange(Math.max(0, volume - 10))}
                    className="p-1 bg-wood-700 hover:bg-wood-600 text-cream-100 border border-wood-600"
                  >
                    <Minus className="w-3 h-3" />
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (isMuted) toggleMute();
                      handleVolumeChange(val);
                    }}
                    className="w-full h-2 bg-wood-900 appearance-none cursor-pointer border border-wood-700"
                    style={{ accentColor: '#c94a4a' }}
                  />

                  <button
                    onClick={() => handleVolumeChange(Math.min(100, volume + 10))}
                    className="p-1 bg-wood-700 hover:bg-wood-600 text-cream-100 border border-wood-600"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t-2 border-wood-700">
              <button
                onClick={handleGiveUp}
                className="w-full py-2.5 flex items-center justify-center gap-2 bg-blood-600/20 border border-blood-600/50 hover:bg-blood-600 text-blood-400 hover:text-cream-100 transition-colors text-[8px] uppercase tracking-widest"
              >
                <Flag className="w-3 h-3" />
                Desistir do Caso
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}