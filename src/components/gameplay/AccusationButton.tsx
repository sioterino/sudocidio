"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

interface AccusationButtonProps {
  disabled?: boolean;
}

export function AccusationButton({ disabled }: AccusationButtonProps) {
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Escuta a resposta do juiz (Phaser)
    const handleResult = (event: Event) => {
      const data = (event as CustomEvent).detail;
      setResultMessage(data.message);
      setIsSuccess(data.success);
      
      // Apaga a mensagem depois de 4 segundos
      setTimeout(() => setResultMessage(null), 4000);
    };

    window.addEventListener("sudocidio:accusationResult", handleResult);
    return () => window.removeEventListener("sudocidio:accusationResult", handleResult);
  }, []);

  const handleAccusationClick = () => {
    // Grita pro Phaser: "Avalia o mapa aí!"
    window.dispatchEvent(new CustomEvent('sudocidio:makeAccusation'));
  };

  return (
    <div className="flex flex-col gap-2">
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
          <span>Acusacao</span>
          <AlertTriangle className="w-4 h-4 animate-pulse" />
        </div>

        <div className="absolute inset-0 border-2 border-cream-300/30 animate-pulse pointer-events-none" />
      </button>

      {/* Caixa de Log do Resultado */}
      {resultMessage && (
        <div className={`p-2 text-center border-l-2 text-[9px] font-bold ${isSuccess ? 'border-green-500 text-green-400 bg-green-900/30' : 'border-blood-500 text-blood-400 bg-blood-900/30'}`}>
          {resultMessage}
        </div>
      )}
    </div>
  );
}