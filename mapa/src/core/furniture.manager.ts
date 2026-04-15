// core/furniture.manager.ts
import type { Scene } from 'phaser';
import type { MapData } from '../types/interfaces';
import type { FurnitureDefinition, PlacedFurniture, OverlapType } from '../types/furniture.registry';
import Coordinates from '../utils/coordinates.utils';

/**
 * Manages furniture placement and overlap constraints on the map.
 */
class FurnitureManager {
    private furnitureMap: Map<string, PlacedFurniture> = new Map(); // "x,y" -> furniture
    
    constructor(
        private scene: Scene,
        private mapData: MapData,
        private getLayer: () => Phaser.Tilemaps.TilemapLayer | null
    ) {}
    
    /**
     * Initialize furniture from map data
     */
    initializeFromMapData(): void {
        if (!this.mapData.furniture) return;
        
        for (const furniture of this.mapData.furniture) {
            this.addFurniture(furniture);
        }
    }
    
    /**
     * Add furniture to the manager
     */
    addFurniture(furniture: PlacedFurniture): void {
        // Store the furniture at its primary tile
        this.furnitureMap.set(`${furniture.tileX},${furniture.tileY}`, furniture);
        
        // For multi-tile furniture, also store secondary tiles
        const furnitureDef = furniture.furniture;
        if (furnitureDef.size === '2x1' && furniture.orientation === 'horizontal') {
            this.furnitureMap.set(`${furniture.tileX + 1},${furniture.tileY}`, furniture);
        } else if (furnitureDef.size === '1x2' && furniture.orientation === 'vertical') {
            this.furnitureMap.set(`${furniture.tileX},${furniture.tileY + 1}`, furniture);
        }
    }
    
    /**
     * Check if a tile is occupied by furniture and what overlap is allowed
     */
    getFurnitureAt(tileX: number, tileY: number): { furniture: PlacedFurniture; overlapType: OverlapType } | null {
        const furniture = this.furnitureMap.get(`${tileX},${tileY}`);
        if (!furniture) return null;
        
        return {
            furniture,
            overlapType: furniture.furniture.overlap
        };
    }
    
    /**
     * Check if an entity can be placed at a specific tile
     */
    canPlaceEntity(
        tileX: number, 
        tileY: number, 
        entityType: 'suspect' | 'victim' | 'weapon'
    ): boolean {
        const furnitureInfo = this.getFurnitureAt(tileX, tileY);
        
        // No furniture at this tile - always allowed (assuming floor tile check is done elsewhere)
        if (!furnitureInfo) return true;
        
        // Check overlap rules
        switch (furnitureInfo.overlapType) {
            case 0: // NONE - no entities allowed
                return false;
            case 1: // NPC_ONLY - only suspects/victims
                return entityType === 'suspect' || entityType === 'victim';
            case 2: // WEAPON_ONLY - only weapons
                return entityType === 'weapon';
            case 3: // BOTH - both NPCs and weapons allowed
                return true;
            default:
                return false;
        }
    }
    
    /**
     * Check if a tile has furniture that blocks movement completely
     */
    isBlockedByFurniture(tileX: number, tileY: number): boolean {
        const furnitureInfo = this.getFurnitureAt(tileX, tileY);
        if (!furnitureInfo) return false;
        
        // Furniture with OverlapType.NONE blocks all entities
        return furnitureInfo.overlapType === 0;
    }
    
    /**
     * Get all furniture
     */
    getAllFurniture(): PlacedFurniture[] {
        return Array.from(this.furnitureMap.values());
    }
    
    /**
     * Clear all furniture
     */
    clear(): void {
        this.furnitureMap.clear();
    }
}

export default FurnitureManager;