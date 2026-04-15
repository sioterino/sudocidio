"use client";

import { useEffect, useRef } from "react";

export function PhaserMapWrapper({ seed }: { seed?: string }) {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<any>(null);

  useEffect(() => {
    // só carrega o navegador
    const initPhaser = async () => {
      if (typeof window === "undefined" || !gameContainerRef.current || gameInstanceRef.current) return;

      try {

        const PhaserModule = await import("phaser");
        const Phaser = PhaserModule.default || PhaserModule;
        
       // importe a cena do jogo 
        const { GameScene } = await import("../../../mapa/src/scenes/game.scene");
        
        // importa a cena
        const { PreloadScene } = await import("../../../mapa/src/scenes/preload.scene");

        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          parent: gameContainerRef.current,
          width: 800,
          height: 600,
          scene: [PreloadScene, GameScene], //preloadScene
          backgroundColor: "transparent",
        };

        gameInstanceRef.current = new Phaser.Game(config);
      } catch (error) {
        console.error("Erro ao carregar o mapa do Phaser:", error);
      }
    };

    initPhaser();

    // quando você sair da tela do jogo destroi a engine para não vazar memória
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, []); // o array vazio garante que inicie apenas 1 vez

  return (
    //retorna a cena
    <div
      id="game-canvas-wrapper"
      ref={gameContainerRef}
      className="w-full h-full flex items-center justify-center rounded-lg overflow-hidden bg-black/40"
    />
  );
}