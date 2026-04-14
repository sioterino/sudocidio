"use client";

import { FileText, MapPin, Clock, AlertTriangle } from "lucide-react";

interface Clue {
  id: string;
  type: "location" | "time" | "spatial" | "witness";
  text: string;
}

interface CluesPanelProps {
  clues: Clue[];
}

function ClueIcon({ type }: { type: Clue["type"] }) {
  const iconClass = "w-3 h-3";
  switch (type) {
    case "location":
      return <MapPin className={`${iconClass} text-suspect-cyan`} />;
    case "time":
      return <Clock className={`${iconClass} text-suspect-yellow`} />;
    case "spatial":
      return <AlertTriangle className={`${iconClass} text-suspect-orange`} />;
    case "witness":
      return <FileText className={`${iconClass} text-suspect-green`} />;
  }
}

export function CluesPanel({ clues }: CluesPanelProps) {
  return (
    <div className="panel flex flex-col h-full">
      <div className="panel-header flex items-center gap-2">
        <FileText className="w-3 h-3 text-cream-300" />
        <span>Historico</span>
      </div>
      
      <div className="flex-1 p-2 overflow-y-auto space-y-2">
        {clues.map((clue) => (
          <div
            key={clue.id}
            className="flex items-start gap-2 p-2 bg-wood-900/50 border border-wood-700"
          >
            <div className="mt-0.5 flex-shrink-0">
              <ClueIcon type={clue.type} />
            </div>
            <p className="text-[7px] text-cream-200 leading-relaxed">{clue.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
