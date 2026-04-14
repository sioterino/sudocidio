"use client";

import Image from "next/image";

export interface CharacterDecorProps {
  position: "left" | "right";
  characters: Array<{
    src: string;
    alt: string;
    delay?: number;
  }>;
}

export function CharacterDecor({ position, characters }: CharacterDecorProps) {
  const positionStyles = {
    left: "left-4 md:left-8 lg:left-16",
    right: "right-4 md:right-8 lg:right-16",
  };

  return (
    <div
      className={`absolute bottom-8 ${positionStyles[position]} flex flex-col gap-4`}
    >
      {characters.map((char, index) => (
        <div
          key={char.src}
          className="animate-float"
          style={{
            animationDelay: `${char.delay ?? index * 0.5}s`,
          }}
        >
          <Image
            src={char.src}
            alt={char.alt}
            width={64}
            height={64}
            className="drop-shadow-lg"
            priority
          />
        </div>
      ))}
    </div>
  );
}
