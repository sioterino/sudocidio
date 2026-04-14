"use client";

import { Eye, Shuffle, Lightbulb, Lock, ShieldOff, EyeOff } from "lucide-react";

interface SabotageAction {
  id: string;
  name: string;
  icon: React.ReactNode;
  cooldown?: number;
  disabled?: boolean;
}

const defaultActions: SabotageAction[] = [
  { id: "peek", name: "PEEK", icon: <Eye className="w-3.5 h-3.5" />, cooldown: 15 },
  { id: "swap", name: "SWAP", icon: <Shuffle className="w-3.5 h-3.5" />, cooldown: 30 },
  { id: "hint", name: "HINT", icon: <Lightbulb className="w-3.5 h-3.5" /> },
  { id: "lock", name: "LOCK", icon: <Lock className="w-3.5 h-3.5" />, cooldown: 15 },
  { id: "block", name: "BLOQUEIO", icon: <ShieldOff className="w-3.5 h-3.5" />, disabled: true },
  { id: "obscure", name: "OFUSCAR", icon: <EyeOff className="w-3.5 h-3.5" />, disabled: true },
];

interface SabotagePanelProps {
  actions?: SabotageAction[];
  onActionClick?: (actionId: string) => void;
}

export function SabotagePanel({ actions = defaultActions, onActionClick }: SabotagePanelProps) {
  return (
    <div className="panel flex flex-col">
      <div className="panel-header flex items-center gap-2">
        <ShieldOff className="w-3 h-3 text-blood-400" />
        <span>Sabotagem</span>
      </div>

      <div className="p-2 grid grid-cols-2 gap-1.5">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick?.(action.id)}
            disabled={action.disabled}
            className={`action-btn flex flex-col items-center gap-1 py-2 ${
              action.disabled ? "opacity-40" : ""
            }`}
          >
            <div className={action.disabled ? "text-wood-500" : "text-cream-300"}>
              {action.icon}
            </div>
            <span className="text-[6px]">{action.name}</span>
            {action.cooldown && !action.disabled && (
              <span className="text-[5px] text-blood-400">{action.cooldown}s</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
