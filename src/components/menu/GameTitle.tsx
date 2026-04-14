"use client";

export interface GameTitleProps {
  title: string;
  subtitle?: string;
}

export function GameTitle({ title, subtitle }: GameTitleProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="text-3xl md:text-4xl lg:text-5xl text-blood-400 pixel-text-shadow tracking-widest animate-pulse-slow">
        {title}
      </h1>
      {subtitle && (
        <p className="text-xs md:text-sm text-cream-200 tracking-wide opacity-80">
          {subtitle}
        </p>
      )}
    </div>
  );
}
