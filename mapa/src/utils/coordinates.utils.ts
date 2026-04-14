// utils/coordinates.utils.ts
export default class Coordinates {
    
    static screenToTile(
        screenX: number, screenY: number, layerX: number, layerY: number, scale: number, tileSize: number = 16
    ): { tileX: number; tileY: number } | null {
        const scaledTileSize = tileSize * scale;
        const tileX = Math.floor((screenX - layerX) / scaledTileSize);
        const tileY = Math.floor((screenY - layerY) / scaledTileSize);
        
        return { tileX, tileY };
    }

    static isValidTile(tileX: number, tileY: number, width: number, height: number): boolean {
        return tileX >= 0 && tileX < width && tileY >= 0 && tileY < height;
    }
}