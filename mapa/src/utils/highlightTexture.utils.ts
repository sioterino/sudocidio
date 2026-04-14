// utils/HighlightGenerator.ts
import { Scene } from 'phaser';
import { RoomType, RoomTypeMetaMap } from '../types/interfaces';

class HighlightGenerator {
    constructor(private scene: Scene) {}

    generateAll(): void {
        const roomTypes = [RoomType.BEDROOM, RoomType.OFFICE, RoomType.BATHROOM, RoomType.KITCHEN, RoomType.LIVING_ROOM, RoomType.GARAGE, RoomType.YARD];
        
        roomTypes.forEach(roomType => {
            const baseKey = `tile_${roomType}`;
            const highlightKey = `tile_${roomType}_highlight`;
            
            if (!this.scene.textures.exists(highlightKey)) {
                this.create(baseKey, highlightKey);
            }
        });
    }

    private create(baseKey: string, highlightKey: string): void {
        const texture = this.scene.textures.get(baseKey);
        if (!texture?.source[0]?.image) return;

        const image = texture.source[0].image as HTMLImageElement;
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d')!;
        
        ctx.drawImage(image, 0, 0, 16, 16);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(0, 0, 16, 16);
        
        this.scene.textures.addCanvas(highlightKey, canvas);
    }
}

export default HighlightGenerator