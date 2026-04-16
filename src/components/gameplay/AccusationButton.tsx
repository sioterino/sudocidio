"use client";

import { AlertTriangle, MapPin, Skull, Wrench } from "lucide-react";
import { useEffect, useState } from "react";

interface AccusationButtonProps {
  disabled?: boolean;
}

export function AccusationButton({ disabled }: AccusationButtonProps) {
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // 👉 AQUI: Os 3 estados para os 3 campos!
  const [roomInput, setRoomInput] = useState("");
  const [weaponInput, setWeaponInput] = useState("");
  const [murdererInput, setMurdererInput] = useState("");

  useEffect(() => {
    const handleResult = (event: Event) => {
      const data = (event as CustomEvent).detail;
      setResultMessage(data.message);
      setIsSuccess(data.success);

      setTimeout(() => setResultMessage(null), 5000);
    };

    window.addEventListener("sudocidio:accusationResult", handleResult);
    return () => window.removeEventListener("sudocidio:accusationResult", handleResult);
  }, []);

  const handleAccusationClick = () => {
    // Exige que os 3 campos estejam preenchidos
    if (!murdererInput.trim() || !weaponInput.trim()) {
      setResultMessage("Preencha o Cômodo, a Arma e o Assassino!");
      return;
    }

    // 👉 AQUI: Envia os 3 dados pro Phaser!
    window.dispatchEvent(new CustomEvent('sudocidio:makeAccusation', {
      detail: {
        room: roomInput,
        weapon: weaponInput,
        murderer: murdererInput
      }
    }));
  };

  return (
    <div className="flex flex-col gap-2 p-2 bg-wood-800/50 border border-wood-700">
      
      {/* Campo: Cômodo 
      <div className="flex flex-col gap-1.5 mb-1">
        <div className="flex items-center gap-1.5 px-1">
          <MapPin className="w-3 h-3 text-wood-300" />
          <span className="text-[7px] uppercase tracking-wider text-wood-300">Cena do Crime</span>
        </div>
        <input
          type="text"
          placeholder="Ex: Biblioteca"
          value={roomInput}
          onChange={(e) => setRoomInput(e.target.value)}
          disabled={isSuccess}
          className="w-full bg-wood-900 border border-wood-600 text-cream-100 text-[10px] px-2 py-1.5 focus:outline-none focus:border-blood-400 placeholder:text-wood-600 uppercase transition-colors"
        />
      </div>
      */}

      {/* Campo: Assassino */}
      <div className="flex flex-col gap-1.5 mb-2">
        <div className="flex items-center gap-1.5 px-1">
          <Skull className="w-3 h-3 text-wood-300" />
          <span className="text-[7px] uppercase tracking-wider text-wood-300">Assassino</span>
        </div>
        <input
          type="text"
          placeholder="Ex: Valquiria"
          value={murdererInput}
          onChange={(e) => setMurdererInput(e.target.value)}
          disabled={isSuccess}
          className="w-full bg-wood-900 border border-wood-600 text-cream-100 text-[10px] px-2 py-1.5 focus:outline-none focus:border-blood-400 placeholder:text-wood-600 uppercase transition-colors"
        />
      </div>

      {/* Campo: Arma */}
      <div className="flex flex-col gap-1.5 mb-1">
        <div className="flex items-center gap-1.5 px-1">
          <Wrench className="w-3 h-3 text-wood-300" />
          <span className="text-[7px] uppercase tracking-wider text-wood-300">Arma do Crime</span>
        </div>
        <input
          type="text"
          placeholder="Ex: Veneno"
          value={weaponInput}
          onChange={(e) => setWeaponInput(e.target.value)}
          disabled={isSuccess}
          className="w-full bg-wood-900 border border-wood-600 text-cream-100 text-[10px] px-2 py-1.5 focus:outline-none focus:border-blood-400 placeholder:text-wood-600 uppercase transition-colors"
        />
      </div>

      {/* Botão de Acusação */}
      <button
        onClick={handleAccusationClick}
        disabled={disabled || isSuccess}
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
        <div className="relative flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
          <span>Acusar</span>
          <AlertTriangle className="w-4 h-4 animate-pulse" />
        </div>
        <div className="absolute inset-0 border-2 border-cream-300/30 animate-pulse pointer-events-none" />
      </button>

      {/* Log de Erro/Acerto */}
      {resultMessage && (
        <div className={`p-2 text-center border-l-2 text-[9px] font-bold ${isSuccess ? 'border-green-500 text-green-400 bg-green-900/30' : 'border-blood-500 text-blood-400 bg-blood-900/30'}`}>
          {resultMessage}
        </div>
      )}
    </div>
  );
}