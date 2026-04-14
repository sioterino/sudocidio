import { RoomTypeMetaMap, RoomType } from '../types/interfaces';

class HighlightManager {
    
    private currentHighlight: { x: number; y: number } | null = null;

    constructor(
        private getTileValue: (x: number, y: number) => number,
        private updateTile: (x: number, y: number, value: number) => void
    ) {}

    highlight(tileX: number, tileY: number): { roomName: string; isHighlightable: boolean } {
        const tileValue = this.getTileValue(tileX, tileY);
        
        // Remove previous highlight
        if (this.currentHighlight) {
            const { x, y } = this.currentHighlight;
            const originalValue = this.getTileValue(x, y);
            this.updateTile(x, y, originalValue);
        }
        
        // Apply new highlight if not a wall
        if (tileValue !== 1) {
            const highlightTile = tileValue + 8;
            this.updateTile(tileX, tileY, highlightTile);
            this.currentHighlight = { x: tileX, y: tileY };
            
            const roomName = RoomTypeMetaMap[tileValue as RoomType]?.name || '—';
            return { roomName, isHighlightable: true };
        }
        
        this.currentHighlight = null;
        return { roomName: '—', isHighlightable: false };
    }

    clear(): void {
        if (this.currentHighlight) {
            const { x, y } = this.currentHighlight;
            const originalValue = this.getTileValue(x, y);
            this.updateTile(x, y, originalValue);
            this.currentHighlight = null;
        }
    }

}

export default HighlightManager