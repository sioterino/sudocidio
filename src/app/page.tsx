"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import {
  PixelBackground,
  MenuPanel,
  GameTitle,
  MenuButton,
  CharacterDecor,
  Footer,
} from "@/src/components/menu";
import { AuthProvider, useAuth } from "@/src/contexts/AuthContext";

// ─── Todos os NPCs disponíveis ────────────────────────────────────────────────

const ALL_NPCS = [
  { src: "/assets/npcs/SFA-D.png", alt: "Diana" },
  { src: "/assets/npcs/SFA-E.png", alt: "Eliana" },
  { src: "/assets/npcs/SFA-F.png", alt: "Fernanda" },
  { src: "/assets/npcs/SFB-G.png", alt: "Gabriela" },
  { src: "/assets/npcs/SFB-H.png", alt: "Helena" },
  { src: "/assets/npcs/SFB-I.png", alt: "Isabela" },
  { src: "/assets/npcs/SFW-A.png", alt: "Amanda" },
  { src: "/assets/npcs/SFW-B.png", alt: "Bianca" },
  { src: "/assets/npcs/SFW-C.png", alt: "Clara" },
  { src: "/assets/npcs/SMA-D.png", alt: "Daniel" },
  { src: "/assets/npcs/SMA-E.png", alt: "Eduardo" },
  { src: "/assets/npcs/SMA-F.png", alt: "Felipe" },
  { src: "/assets/npcs/SMB-G.png", alt: "Gustavo" },
  { src: "/assets/npcs/SMB-H.png", alt: "Henrique" },
  { src: "/assets/npcs/SMB-I.png", alt: "Igor" },
  { src: "/assets/npcs/SMW-A.png", alt: "André" },
  { src: "/assets/npcs/SMW-B.png", alt: "Bruno" },
  { src: "/assets/npcs/SMW-C.png", alt: "Carlos" },
];

function pickRandom<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="flex-shrink-0">
      <path d="M4 2v12l10-6z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="16" height="16" className="flex-shrink-0">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.1-11.4-7.6l-6.5 5C9.5 39.4 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.2 5.2C37 39 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"/>
    </svg>
  );
}

// ─── Inner ────────────────────────────────────────────────────────────────────

function HomePageInner() {
  const router = useRouter();
  const { isAuthenticated, login } = useAuth();

  // useMemo garante que o sorteio acontece só uma vez por montagem
  const [leftCharacters, rightCharacters] = useMemo(() => {
    const picked = pickRandom(ALL_NPCS, 4);
    const left  = picked.slice(0, 2).map((c, i) => ({ ...c, delay: i * 0.7 }));
    const right = picked.slice(2, 4).map((c, i) => ({ ...c, delay: 0.3 + i * 0.7 }));
    return [left, right];
  }, []);

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden scanlines">
      <PixelBackground floorSrc="/assets/floor/wooden.png" overlayOpacity={0.65} />

      <CharacterDecor position="left"  characters={leftCharacters} />
      <CharacterDecor position="right" characters={rightCharacters} />

      <MenuPanel>
        <GameTitle title="SUDOCIDIO" subtitle="Um misterio em cada celula" />

        <div className="w-full h-1 bg-gradient-to-r from-transparent via-wood-500 to-transparent opacity-50" />

        <nav className="flex flex-col gap-4 w-full items-center">
          <MenuButton
            variant="primary"
            onClick={() => router.push("/game")}
            icon={<PlayIcon />}
            disabled={!isAuthenticated}
            className={!isAuthenticated ? "opacity-40 cursor-not-allowed" : ""}
          >
            Entrar no Caso
          </MenuButton>

          {isAuthenticated ? (
            <p className="font-pixel text-[10px] text-green-400 uppercase tracking-wider text-center">
              ✓ Logado com Google
            </p>
          ) : (
            <MenuButton variant="secondary" onClick={login} icon={<GoogleIcon />}>
              Entrar com Google
            </MenuButton>
          )}
        </nav>

        <p className="text-[8px] text-cream-300/50 text-center leading-relaxed max-w-[240px]">
          Desvende o crime antes que o tempo acabe
        </p>
      </MenuPanel>

      <Footer credits="Criado por Julia & Sofia" />
    </main>
  );
}

export default function HomePage() {
  return (
    <AuthProvider>
      <HomePageInner />
    </AuthProvider>
  );
}