// scenes/PreloadScene.ts
import { Scene } from 'phaser';
import TextureLoader from '../core/texture.loader';
import TilesetBuilder from '../core/tileset.builder';
import HighlightGenerator from '../utils/highlightTexture.utils';

export class PreloadScene extends Scene {
    private textureService!: TextureLoader;
    private highlightGenerator!: HighlightGenerator;
    private tilesetService!: TilesetBuilder;

    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload(): void {
        this.textureService = new TextureLoader(this);
        this.textureService.loadAll();
    }

    create(): void {
        this.highlightGenerator = new HighlightGenerator(this);
        this.highlightGenerator.generateAll();
        
        this.tilesetService = new TilesetBuilder(this);
        this.tilesetService.build();
        
        this.scene.start('GameScene');
    }
}