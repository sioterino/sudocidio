import { Scene } from 'phaser';
import { RoomType, RoomTypeMetaMap } from '../types/interfaces';

export class TilesetBuilder {
    private readonly TILE_SIZE = 16;
    private readonly TOTAL_TILES = 20;

    constructor(private scene: Scene) {}

    build(): void {
        const canvas = this.createCanvas();
        const ctx = canvas.getContext('2d')!;
        
        this.drawWall(ctx);
        this.drawEmpty(ctx);
        this.drawRooms(ctx);
        this.drawHighlights(ctx);
        
        this.scene.textures.addCanvas('tileset', canvas);
    }

    private createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = this.TILE_SIZE * this.TOTAL_TILES;
        canvas.height = this.TILE_SIZE;
        return canvas;
    }

    private drawWall(ctx: CanvasRenderingContext2D): void {
        this.drawTexture(ctx, 'tile_wall', 0);
    }

    private drawEmpty(ctx: CanvasRenderingContext2D): void {
        ctx.fillStyle = '#000000';
        ctx.fillRect(1 * this.TILE_SIZE, 0, this.TILE_SIZE, this.TILE_SIZE);
    }

    private drawRooms(ctx: CanvasRenderingContext2D): void {
        const roomTypes = [RoomType.BEDROOM, RoomType.OFFICE, RoomType.BATHROOM, RoomType.KITCHEN, RoomType.LIVING_ROOM, RoomType.GARAGE, RoomType.YARD];
        
        roomTypes.forEach(roomType => {
            const meta = RoomTypeMetaMap[roomType];
            this.drawTexture(ctx, `tile_${roomType}`, meta.tileIndex);
        });
    }

    private drawHighlights(ctx: CanvasRenderingContext2D): void {
        const roomTypes = [RoomType.BEDROOM, RoomType.OFFICE, RoomType.BATHROOM, RoomType.KITCHEN, RoomType.LIVING_ROOM, RoomType.GARAGE, RoomType.YARD];
        
        roomTypes.forEach(roomType => {
            const meta = RoomTypeMetaMap[roomType];
            this.drawTexture(ctx, `tile_${roomType}_highlight`, meta.highlightIndex);
        });
    }

    private drawTexture(ctx: CanvasRenderingContext2D, key: string, tileIndex: number): void {
        const texture = this.scene.textures.get(key);
        const x = tileIndex * this.TILE_SIZE;
        
        if (texture?.source[0]?.image) {
            ctx.drawImage(texture.source[0].image as HTMLImageElement, x, 0, this.TILE_SIZE, this.TILE_SIZE);
        } else {
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(x, 0, this.TILE_SIZE, this.TILE_SIZE);
        }
    }
}

export default TilesetBuilder