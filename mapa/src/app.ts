import * as Phaser from 'phaser';
import { PreloadScene } from './scenes/preload.scene';
import { GameScene } from './scenes/game.scene';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 700,
    height: 450,
    parent: 'game-container',
    scene: [ PreloadScene, GameScene ],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false
        }
    },
    backgroundColor: 'rgba(0,0,0,0)',
    transparent: true,
    pixelArt: true,
    zoom: 2
};

window.addEventListener('load', () => {
    const game = new Phaser.Game(config);

    // gets rid of the context menu when the user right clicks to remove a entity from the map
    setTimeout(() => {
        const canvas = game.canvas;
        if (canvas)
            canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }, 0);
});