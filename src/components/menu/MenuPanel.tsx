"use client";

import { type ReactNode } from "react";

export interface MenuPanelProps {
  children: ReactNode;
}

export function MenuPanel({ children }: MenuPanelProps) {
  return (
    <div className="relative z-10 flex flex-col items-center gap-8 p-8 md:p-12 bg-wood-800/95 pixel-border max-w-xl w-full mx-4">
      {children}
    </div>
  );
}
