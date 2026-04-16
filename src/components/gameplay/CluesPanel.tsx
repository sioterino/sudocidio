"use client";

import { FileText } from "lucide-react";

export interface ClueData {
  id: string;
  entityName: string;
  entityType?: string; // 'suspect', 'weapon', 'victim', ou 'SISTEMA'
  text: string;
  isInitial?: boolean; // Para sabermos se escrevemos "Dica inicial:" ou "Nova dica:"
}

interface CluesPanelProps {
  clues: ClueData[];
}

export function CluesPanel({ clues }: CluesPanelProps) {
  return (
    <div className="panel flex flex-col h-full bg-[#1a0f0a] border border-[#3d2516]">
      {/* Título do Painel no estilo do jogo */}
      <div className="panel-header flex items-center justify-center py-2 border-b border-[#3d2516]">
        <span className="text-[#ffd700] font-bold text-[12px] tracking-widest uppercase">
          Dicas
        </span>
      </div>
      
      {/* Área de Scroll com as Dicas */}
      <div className="flex-1 p-3 overflow-y-auto custom-scroll">
        {clues.length === 0 && (
          <p className="text-[9px] text-[#888888] text-center mt-4">
            Aguardando dicas do sistema...
          </p>
        )}
        
        {clues.map((clue, index) => {
          // Define a cor do cartão baseado no tipo (Personagem = Vermelho, Arma = Laranja)
          const themeColor = clue.entityType === 'suspect' ? '#ff6666' : 
                             clue.entityType === 'weapon' ? '#ffb74d' : 
                             clue.entityType === 'SISTEMA' ? '#4d9a4d' : '#888888';

          // As primeiras dicas geradas ao abrir o mapa consideramos "Iniciais"
          const hintLabel = index > 5 ? "Nova dica:" : "Dica inicial:";

          return (
            <div
              key={clue.id}
              className="flex flex-col bg-black/50 rounded-md p-2.5 mb-3 border-l-[3px]"
              style={{ borderColor: themeColor }}
            >
              {/* Nome do Personagem / Entidade */}
              <span 
                className="font-bold text-[11px] mb-1.5" 
                style={{ color: themeColor }}
              >
                {clue.entityName}
              </span>

              {/* Subtítulo Dica (Amarelo) */}
              <span className="text-[#ff9800] text-[9px] mb-1">
                {hintLabel}
              </span>

              {/* Texto da Dica */}
              <span className="text-[#cccccc] text-[10px] leading-relaxed">
                {clue.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}