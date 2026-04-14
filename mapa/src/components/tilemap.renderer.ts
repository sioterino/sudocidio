import { Scene } from 'phaser';
import type { GameEntities, PlacedEntity, Suspect, Victim, Weapon } from '../types/npc.registry';
import type { PlacedFurniture, FurnitureDefinition } from '../types/furniture.registry';
import FurnitureGenerator from '../generators/furniture.generator';

class TilemapRenderer {
    private groundLayer: Phaser.Tilemaps.TilemapLayer | null = null;
    private entitySprites: Phaser.GameObjects.Sprite[] = [];
    private entityPositions: Map<string, PlacedEntity> = new Map();
    private furnitureSprites: Phaser.GameObjects.Sprite[] = [];
    private furniturePositions: Map<string, PlacedFurniture> = new Map();

    constructor(private scene: Scene) {}
    
    render(tiles: number[][], width: number, height: number): Phaser.Tilemaps.TilemapLayer {
        const map = this.scene.make.tilemap({ tileWidth: 16, tileHeight: 16, width: width, height: height });

        const tileset = map.addTilesetImage('tileset', undefined, 16, 16);
        if (!tileset) throw new Error('Failed to create tileset');

        this.groundLayer = map.createBlankLayer('ground', tileset)!;
        if (!this.groundLayer) throw new Error('Failed to create ground layer');

        this.fillLayer(tiles);
        this.groundLayer.setCollision(1);

        return this.groundLayer;
    }

    /**
     * Renders game entities (suspects, victim, weapons) as sprites above the ground layer.
     */
    renderEntities(entities: GameEntities): void {
        // Clear existing entity sprites and positions
        this.clearEntitySprites();
        this.entityPositions.clear();
        
        if (!this.groundLayer) return;
        
        const tileSize = 16;
        const layerX = this.groundLayer.x;
        const layerY = this.groundLayer.y;
        const scale = this.groundLayer.scaleX;
        
        // Render weapons first (below characters)
        for (const placedWeapon of entities.weapons) {
            this.renderEntity(placedWeapon, tileSize, layerX, layerY, scale);
        }
        
        // Render suspects
        for (const placedSuspect of entities.suspects) {
            this.renderEntity(placedSuspect, tileSize, layerX, layerY, scale);
        }
        
        // Render victim
        this.renderEntity(entities.victim, tileSize, layerX, layerY, scale);
    }

    /**
     * Renders a single entity as a sprite.
     */
    private renderEntity(
        placed: PlacedEntity,
        tileSize: number,
        layerX: number,
        layerY: number,
        scale: number
    ): void {
        const entity = placed.entity;
        let textureKey: string;
        
        if (placed.type === 'suspect') {
            textureKey = (entity as Suspect).textureKey;
        } else if (placed.type === 'victim') {
            textureKey = (entity as Victim).textureKey;
        } else {
            textureKey = (entity as Weapon).textureKey;
        }
        
        // Calculate pixel position (center of tile)
        const pixelX = layerX + (placed.tileX * tileSize * scale) + (tileSize * scale / 2);
        const pixelY = layerY + (placed.tileY * tileSize * scale) + (tileSize * scale / 2);
        
        const sprite = this.scene.add.sprite(pixelX, pixelY, textureKey);
        
        // Scale sprite to fit 16x16 tile size, then apply layer scale
        const textureWidth = sprite.width;
        const textureHeight = sprite.height;
        const spriteScale = Math.min(tileSize / textureWidth, tileSize / textureHeight) * scale;
        sprite.setScale(spriteScale);
        sprite.setDepth(10); // Above ground layer
        
        // Store entity position for hover lookup
        const posKey = `${placed.tileX},${placed.tileY}`;
        this.entityPositions.set(posKey, placed);
        
        // Store reference for cleanup
        this.entitySprites.push(sprite);
    }

    /**
     * Renders furniture in rooms as sprites.
     */
    renderFurniture(furniture: PlacedFurniture[]): void {
        // Clear existing furniture sprites and positions
        this.clearFurnitureSprites();
        this.furniturePositions.clear();
        
        if (!this.groundLayer) return;
        
        const tileSize = 16;
        const layerX = this.groundLayer.x;
        const layerY = this.groundLayer.y;
        const scale = this.groundLayer.scaleX;
        
        for (const placed of furniture) {
            this.renderFurniturePiece(placed, tileSize, layerX, layerY, scale);
        }
    }

    /**
     * Renders a single piece of furniture.
     */
    private renderFurniturePiece(
        placed: PlacedFurniture,
        tileSize: number,
        layerX: number,
        layerY: number,
        scale: number
    ): void {
        const { furniture, tileX, tileY } = placed;
        
        if (furniture.size === '1x1') {
            // Simple 1x1 furniture
            const textureKey = furniture.textureKey as string;
            this.createFurnitureSprite(textureKey, tileX, tileY, tileSize, layerX, layerY, scale);
            
            // Store position
            this.furniturePositions.set(`${tileX},${tileY}`, placed);
        } else {
            // Multi-tile furniture
            const textureKeys = furniture.textureKey as [string, string];
            
            // First tile
            this.createFurnitureSprite(textureKeys[0], tileX, tileY, tileSize, layerX, layerY, scale);
            this.furniturePositions.set(`${tileX},${tileY}`, placed);
            
            // Second tile
            let secondX = tileX;
            let secondY = tileY;
            
            if (furniture.size === '2x1') {
                secondX = tileX + 1;
            } else if (furniture.size === '1x2') {
                secondY = tileY + 1;
            }
            
            this.createFurnitureSprite(textureKeys[1], secondX, secondY, tileSize, layerX, layerY, scale);
            this.furniturePositions.set(`${secondX},${secondY}`, placed);
        }
    }

    /**
     * Creates a furniture sprite at the given position.
     */
    private createFurnitureSprite(
        textureKey: string,
        tileX: number,
        tileY: number,
        tileSize: number,
        layerX: number,
        layerY: number,
        scale: number
    ): void {
        const pixelX = layerX + (tileX * tileSize * scale) + (tileSize * scale / 2);
        const pixelY = layerY + (tileY * tileSize * scale) + (tileSize * scale / 2);
        
        const sprite = this.scene.add.sprite(pixelX, pixelY, textureKey);
        
        // Scale sprite to fit tile
        const textureWidth = sprite.width;
        const textureHeight = sprite.height;
        const spriteScale = Math.min(tileSize / textureWidth, tileSize / textureHeight) * scale;
        sprite.setScale(spriteScale);
        sprite.setDepth(5); // Between ground and entities
        
        this.furnitureSprites.push(sprite);
    }

    /**
     * Clears all furniture sprites.
     */
    private clearFurnitureSprites(): void {
        for (const sprite of this.furnitureSprites) {
            sprite.destroy();
        }
        this.furnitureSprites = [];
    }

    /**
     * Gets entity at a specific tile position.
     */
    getEntityAt(tileX: number, tileY: number): PlacedEntity | null {
        const posKey = `${tileX},${tileY}`;
        return this.entityPositions.get(posKey) || null;
    }

    /**
     * Gets furniture at a specific tile position.
     */
    getFurnitureAt(tileX: number, tileY: number): PlacedFurniture | null {
        const posKey = `${tileX},${tileY}`;
        return this.furniturePositions.get(posKey) || null;
    }

    /**
     * Clears all entity sprites.
     */
    private clearEntitySprites(): void {
        for (const sprite of this.entitySprites) {
            sprite.destroy();
        }
        this.entitySprites = [];
    }

    private fillLayer(tiles: number[][]): void {
        if (!this.groundLayer) return;
        
        for (let y = 0; y < tiles.length; y++)
            for (let x = 0; x < tiles[0].length; x++)
                this.groundLayer.putTileAt(tiles[y][x], x, y);
    }

    updateTile(x: number, y: number, tileValue: number): void {
        if (this.groundLayer)
            this.groundLayer.putTileAt(tileValue, x, y);
    }

    getLayer(): Phaser.Tilemaps.TilemapLayer | null {
        return this.groundLayer;
    }

    destroy(): void {
        this.clearEntitySprites();
        this.clearFurnitureSprites();
        if (this.groundLayer) {
            this.groundLayer.destroy();
            this.groundLayer = null;
        }
    }
}

export default TilemapRenderer
