"use client";

import { AlertTriangle, MapPin, Skull, Wrench, X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface AccusationButtonProps {
  disabled?: boolean;
}

export function AccusationButton({ disabled }: AccusationButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Os 3 estados para os 3 campos
  const [roomInput, setRoomInput] = useState("");
  const [weaponInput, setWeaponInput] = useState("");
  const [murdererInput, setMurdererInput] = useState("");

  // Fecha o modal ao apertar ESC
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape" && isModalOpen) {
      setIsModalOpen(false);
    }
  }, [isModalOpen]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const handleResult = (event: Event) => {
      const data = (event as CustomEvent).detail;
      setResultMessage(data.message);
      setIsSuccess(data.success);

      if (data.success) {
        setTimeout(() => {
          setResultMessage(null);
          setIsModalOpen(false);
        }, 4000);
      } else {
        setTimeout(() => setResultMessage(null), 5000);
      }
    };

    window.addEventListener("sudocidio:accusationResult", handleResult);
    return () => window.removeEventListener("sudocidio:accusationResult", handleResult);
  }, []);

  const handleAccusationClick = () => {
    // Exige que os 3 campos estejam preenchidos
    if (!roomInput.trim() || !murdererInput.trim() || !weaponInput.trim()) {
      setResultMessage("Preencha a Cena do Crime, a Arma e o Assassino!");
      return;
    }

    // Dispara o evento com os 3 campos pro Phaser avaliar
    window.dispatchEvent(new CustomEvent('sudocidio:makeAccusation', {
      detail: {
        room: roomInput,
        weapon: weaponInput,
        murderer: murdererInput
      }
    }));
  };

  return (
    <>
      {/* Botão Principal na Tela (Barra Lateral) */}
      <button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled || isSuccess}
        className={`
          relative overflow-hidden w-full py-4 px-4
          bg-gradient-to-b from-blood-400 to-blood-600
          border-4 border-blood-500
          text-[10px] uppercase tracking-widest text-cream-100 font-bold
          transition-all duration-200
          hover:from-blood-500 hover:to-blood-400
          hover:scale-[1.02] active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          group shadow-lg mt-auto
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
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          <span>Acusacao</span>
          <AlertTriangle className="w-5 h-5 animate-pulse" />
        </div>
      </button>

      {/* Modal de Acusação */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 99999 }}>
          
          {/* Backdrop Escuro */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Painel Central do Modal */}
          <div 
            className="relative bg-[#3e2723] border-4 border-blood-600 p-5 flex flex-col gap-4 w-80 shadow-2xl"
            style={{ boxShadow: 'inset -2px -2px 0 0 #2a1610, inset 2px 2px 0 0 #5c3a21, 0 10px 25px rgba(0,0,0,0.9)' }}
          >
            {/* Header do Modal */}
            <div className="flex items-center justify-between border-b-2 border-[#5c3a21] pb-2">
              <h2 className="text-lg text-cream-200 tracking-widest font-bold flex items-center gap-2" style={{ textShadow: "1px 1px 0 #2d1b0e" }}>
                <AlertTriangle className="w-5 h-5 text-blood-400" />
                RELATORIO FINAL
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 bg-[#5c3a21] hover:bg-blood-600 text-cream-200 hover:text-white transition-colors border-2 border-[#3e2723]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[9px] text-cream-300 uppercase tracking-widest text-center mb-1">
              Preencha os dados deduzidos para enviar ao juiz.
            </p>

            {/* Campos de Input */}
            <div className="flex flex-col gap-3">
              
              {/* Campo: Cômodo */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 px-1">
                  <MapPin className="w-4 h-4 text-wood-300" />
                  <span className="text-[9px] uppercase tracking-wider text-wood-300 font-bold">Cena do Crime</span>
                </div>
                <input
                  type="text"
                  placeholder="Ex: Biblioteca"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  disabled={isSuccess}
                  className="w-full bg-[#1a0f0a] border-2 border-[#5c3a21] text-cream-100 text-xs px-3 py-2 focus:outline-none focus:border-blood-400 placeholder:text-wood-600 uppercase transition-colors"
                />
              </div>

              {/* Campo: Assassino */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 px-1">
                  <Skull className="w-4 h-4 text-wood-300" />
                  <span className="text-[9px] uppercase tracking-wider text-wood-300 font-bold">Assassino</span>
                </div>
                <input
                  type="text"
                  placeholder="Ex: Valquiria"
                  value={murdererInput}
                  onChange={(e) => setMurdererInput(e.target.value)}
                  disabled={isSuccess}
                  className="w-full bg-[#1a0f0a] border-2 border-[#5c3a21] text-cream-100 text-xs px-3 py-2 focus:outline-none focus:border-blood-400 placeholder:text-wood-600 uppercase transition-colors"
                />
              </div>

              {/* Campo: Arma */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 px-1">
                  <Wrench className="w-4 h-4 text-wood-300" />
                  <span className="text-[9px] uppercase tracking-wider text-wood-300 font-bold">Arma do Crime</span>
                </div>
                <input
                  type="text"
                  placeholder="Ex: Veneno"
                  value={weaponInput}
                  onChange={(e) => setWeaponInput(e.target.value)}
                  disabled={isSuccess}
                  className="w-full bg-[#1a0f0a] border-2 border-[#5c3a21] text-cream-100 text-xs px-3 py-2 focus:outline-none focus:border-blood-400 placeholder:text-wood-600 uppercase transition-colors"
                />
              </div>
            </div>

            {/* Log de Erro/Acerto dentro do Modal */}
            {resultMessage && (
              <div className={`mt-1 p-2 text-center border-l-4 text-[10px] font-bold uppercase tracking-wider ${isSuccess ? 'border-green-500 text-green-400 bg-green-900/30' : 'border-blood-500 text-blood-400 bg-blood-900/30'}`}>
                {resultMessage}
              </div>
            )}

            {/* Botão de Confirmar */}
            <button
              onClick={handleAccusationClick}
              disabled={disabled || isSuccess}
              className={`
                mt-1 relative overflow-hidden w-full py-3 px-4
                bg-gradient-to-b from-blood-600 to-blood-800
                border-2 border-blood-400
                text-[10px] uppercase tracking-widest text-cream-100 font-bold
                transition-all duration-200
                hover:from-blood-500 hover:to-blood-700
                active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              Confirmar Acusacao
            </button>
          </div>
        </div>
      )}
    </>
  );
}