"use client";

import { Eye, Shuffle, Lightbulb, Lock, ShieldOff, EyeOff } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type SabotageType = "BLIND" | "SHUFFLE" | "LOCK" | "HINT";

interface SabotageAction {
  id: SabotageType;
  name: string;
  icon: React.ReactNode;
  cooldownSeconds: number;
  description: string;
}

const ACTIONS: SabotageAction[] = [
  {
    id: "BLIND",
    name: "OFUSCAR",
    icon: <EyeOff className="w-3.5 h-3.5" />,
    cooldownSeconds: 20,
    description: "Escurece a tela do oponente por 5s",
  },
  {
    id: "SHUFFLE",
    name: "SWAP",
    icon: <Shuffle className="w-3.5 h-3.5" />,
    cooldownSeconds: 30,
    description: "Embaralha as peças do oponente",
  },
  {
    id: "HINT",
    name: "HINT",
    icon: <Lightbulb className="w-3.5 h-3.5" />,
    cooldownSeconds: 15,
    description: "Pede uma dica para o Phaser",
  },
  {
    id: "LOCK",
    name: "LOCK",
    icon: <Lock className="w-3.5 h-3.5" />,
    cooldownSeconds: 25,
    description: "Trava o drag & drop do oponente por 5s",
  },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export function SabotagePanel() {
  // cooldownsRestantes[id] = segundos restantes (0 = disponível)
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  // Tick do cooldown — decrementa 1s a cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCooldowns((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const id in next) {
          if (next[id] > 0) {
            next[id] -= 1;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = useCallback((action: SabotageAction) => {
    const remaining = cooldowns[action.id] ?? 0;
    if (remaining > 0) return;

    // Ativa o cooldown
    setCooldowns((prev) => ({ ...prev, [action.id]: action.cooldownSeconds }));

    if (action.id === "HINT") {
      // HINT é local — pede dica ao Phaser diretamente
      window.dispatchEvent(new CustomEvent("sudocidio:requestHint"));
      return;
    }

    // Demais sabotagens vão para o servidor via WebSocket
    window.dispatchEvent(
      new CustomEvent("sudocidio:sendSabotage", {
        detail: { sabotageType: action.id },
      })
    );
  }, [cooldowns]);

  return (
    <div className="panel flex flex-col">
      <div className="panel-header flex items-center gap-2">
        <ShieldOff className="w-3 h-3 text-blood-400" />
        <span>Sabotagem</span>
      </div>

      <div className="p-2 grid grid-cols-2 gap-1.5">
        {ACTIONS.map((action) => {
          const remaining = cooldowns[action.id] ?? 0;
          const onCooldown = remaining > 0;
          const progress = onCooldown
            ? ((action.cooldownSeconds - remaining) / action.cooldownSeconds) * 100
            : 100;

          return (
            <button
              key={action.id}
              onClick={() => handleClick(action)}
              disabled={onCooldown}
              title={action.description}
              className={`
                action-btn relative flex flex-col items-center gap-1 py-2 overflow-hidden
                transition-all duration-200
                ${onCooldown ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.03] active:scale-[0.97]"}
              `}
            >
              {/* Barra de cooldown preenchendo de baixo para cima */}
              {onCooldown && (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-blood-600/30 transition-all duration-1000"
                  style={{ height: `${100 - progress}%` }}
                />
              )}

              <div
                className={`relative ${onCooldown ? "text-wood-500" : "text-cream-300"}`}
              >
                {action.icon}
              </div>

              <span className="relative text-[6px]">{action.name}</span>

              {/* Contador regressivo */}
              <span className="relative text-[5px] text-blood-400 h-2">
                {onCooldown ? `${remaining}s` : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}