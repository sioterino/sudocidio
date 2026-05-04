"use client";
import { useEffect, useRef } from "react";

export function PhaserMapWrapper({ seed }: { seed?: string }) {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameInstanceRef = useRef<any>(null);
  
  // 👉 AQUI: O guarda de trânsito que impede a duplicação!
  const isInitializing = useRef(false);

  useEffect(() => {
    const initPhaser = async () => {
      // Se não tem janela, não tem container, o jogo já existe OU já está carregando, aborte!
      if (typeof window === "undefined" || !gameContainerRef.current || gameInstanceRef.current || isInitializing.current) {
        return;
      }

      // Tranca a porta para a segunda tentativa do Next.js não entrar
      isInitializing.current = true;

      try {
        const PhaserModule = await import("phaser");
        const Phaser = PhaserModule.default || PhaserModule;
        
        const { GameScene } = await import("../../../mapa/src/scenes/game.scene");
        const { PreloadScene } = await import("../../../mapa/src/scenes/preload.scene");

        // Checagem de segurança: se o componente sumiu enquanto o Phaser baixava, aborte!
        if (!gameContainerRef.current) {
          isInitializing.current = false;
          return;
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
        // Libera a porta ao terminar (com sucesso ou erro)
        isInitializing.current = false;
      }
    };

    initPhaser();

    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      id="game-canvas-wrapper" 
      ref={gameContainerRef} 
      className="w-full h-full flex items-center justify-center rounded-lg overflow-hidden bg-black/40" 
    />
  );
}