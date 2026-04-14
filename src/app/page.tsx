"use client";

import { useRouter } from "next/navigation";
import {
  PixelBackground,
  MenuPanel,
  GameTitle,
  MenuButton,
  CharacterDecor,
  Footer,
} from "@/src/components/menu";

// SVG Icons for pixel-perfect rendering
function PlayIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="flex-shrink-0"
    >
      <path d="M4 2v12l10-6z" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="flex-shrink-0"
    >
      <path d="M10 0a6 6 0 0 0-5.27 8.87L0 13.6V16h2.4l4.73-4.73A6 6 0 1 0 10 0zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();

  const leftCharacters = [
    { src: "/assets/npcs/SMW-A.png", alt: "Suspeito Masculino", delay: 0 },
    { src: "/assets/npcs/SFA-D.png", alt: "Suspeita Feminina", delay: 0.7 },
  ];

  const rightCharacters = [
    { src: "/assets/npcs/SFW-A.png", alt: "Suspeita Feminina", delay: 0.3 },
    { src: "/assets/npcs/SMA-D.png", alt: "Suspeito Masculino", delay: 1 },
  ];

  const handleEnterCase = () => {
    router.push("/game");
  };

  const handleFairLogin = () => {
    // TODO: Implement OAuth 2.0 flow for fair code authentication
    console.log("Login com codigo da feira...");
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden scanlines">
      {/* Pixel art background with mansion floor */}
      <PixelBackground
        floorSrc="/assets/floor/wooden.png"
        overlayOpacity={0.65}
      />

      {/* Character decorations on sides */}
      <CharacterDecor position="left" characters={leftCharacters} />
      <CharacterDecor position="right" characters={rightCharacters} />

      {/* Central menu panel */}
      <MenuPanel>
        {/* Game title */}
        <GameTitle
          title="SUDOCIDIO"
          subtitle="Um misterio em cada celula"
        />

        {/* Decorative divider */}
        <div className="w-full h-1 bg-gradient-to-r from-transparent via-wood-500 to-transparent opacity-50" />

        {/* Menu buttons */}
        <nav className="flex flex-col gap-4 w-full items-center">
          <MenuButton
            variant="primary"
            onClick={handleEnterCase}
            icon={<PlayIcon />}
          >
            Entrar no Caso
          </MenuButton>

          <MenuButton
            variant="secondary"
            onClick={handleFairLogin}
            icon={<KeyIcon />}
          >
            Login com Codigo
          </MenuButton>
        </nav>

        {/* Subtitle hint */}
        <p className="text-[8px] text-cream-300/50 text-center leading-relaxed max-w-[240px]">
          Desvende o crime antes que o tempo acabe
        </p>
      </MenuPanel>

      {/* Footer credits */}
      <Footer credits="Criado por Julia & Sofia" />
    </main>
  );
}
