"use client";
import { useEffect, useRef } from "react";

export function PhaserMapWrapper({ seed }: { seed?: string }) {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<any>(null);
  const isInitializing = useRef(false);

  useEffect(() => {
    const initPhaser = async () => {
      if (
        typeof window === "undefined" ||
        !gameContainerRef.current ||
        gameInstanceRef.current ||
        isInitializing.current
      ) return;

      isInitializing.current = true;

      try {
        const PhaserModule = await import("phaser");
        const Phaser = PhaserModule.default || PhaserModule;
        const { GameScene } = await import("../../../mapa/src/scenes/game.scene");
        const { PreloadScene } = await import("../../../mapa/src/scenes/preload.scene");

        if (!gameContainerRef.current) {
          isInitializing.current = false;
          return;
        }

        // ── Injeta a seed ANTES de criar o jogo ──────────────────────────
        // O GameScene vai escutar 'sudocidio:setSeed' no create()
        if (seed) {
          window.__sudocidio_seed = seed;
        }

        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          parent: gameContainerRef.current,
          width: 800,
          height: 600,
          scene: [PreloadScene, GameScene],
          transparent: true,
        };

        gameInstanceRef.current = new Phaser.Game(config);
      } catch (error) {
        console.error("Erro ao carregar o mapa do Phaser:", error);
      } finally {
        isInitializing.current = false;
      }
    };

    initPhaser();

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
        window.__sudocidio_seed = undefined;
      }
    };
  }, []); // Phaser só inicia uma vez — seed já está em window.__sudocidio_seed

  return (
    <div
      id="game-canvas-wrapper"
      ref={gameContainerRef}
      className="w-full h-full flex items-center justify-center rounded-lg overflow-hidden bg-black/40"
    />
  );
}