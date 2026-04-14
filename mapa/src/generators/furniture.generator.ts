import Random from '../core/random.core';
import type { Room } from '../types/interfaces';
import { FurnitureDefinition,  PlacedFurniture,  getFurnitureForRoom, OverlapType } from '../types/furniture.registry';

interface TilePosition {
    tileX: number;
    tileY: number;
    roomId: number;
    isWallAdjacent: boolean;
}

/**
 * Generates and positions furniture in rooms.
 * 
 * Placement rules:
 * 1. Each room must have at least 1 piece of furniture
 * 2. Rooms should have 30-50% of their walkable space occupied by furniture + entities
 * 3. Furniture is placed based on room type constraints
 * 4. Wall-aligned furniture prioritizes positions adjacent to walls
 * 5. Multi-tile furniture (2x1, 1x2) requires contiguous free tiles
 * 6. Larger rooms get more furniture
 * 
 * @author System Architect
 */
class FurnitureGenerator {

    /** Minimum occupancy rate for rooms (30%) */
    private static readonly MIN_OCCUPANCY = 0.40;
    /** Maximum occupancy rate for rooms (50%) */
    private static readonly MAX_OCCUPANCY = 0.50;
    /** Minimum furniture per room */
    private static readonly MIN_FURNITURE_PER_ROOM = 1;

    /**
     * Generates furniture placements for all rooms on the map.
     * 
     * @param tiles - 2D array of tile indices
     * @param rooms - Array of room metadata
     * @param width - Map width in tiles
     * @param height - Map height in tiles
     * @param occupiedTiles - Set of tile keys already occupied by entities
     * @returns Array of placed furniture
     */
    static generate(
        tiles: number[][],  rooms: Room[],  width: number,  height: number, occupiedTiles: Set<string>
    ): PlacedFurniture[] {
        const placedFurniture: PlacedFurniture[] = [];
        const furnitureOccupiedTiles = new Set<string>();
        
        // Process each room
        for (let roomId = 0; roomId < rooms.length; roomId++) {
            const room = rooms[roomId];
            const roomFurniture = this.generateFurnitureForRoom(
                tiles,  room,  roomId,  width,  height, occupiedTiles, furnitureOccupiedTiles
            );
            placedFurniture.push(...roomFurniture);
        }
        
        return placedFurniture;
    }

    /**
     * Generates furniture for a single room.
     */
    private static generateFurnitureForRoom(
        tiles: number[][], room: Room, roomId: number, mapWidth: number, mapHeight: number, entityOccupiedTiles: Set<string>, furnitureOccupiedTiles: Set<string>
    ): PlacedFurniture[] {
        const placed: PlacedFurniture[] = [];
        
        // Get valid tiles for this room
        const roomTiles = this.getRoomTiles(tiles, room, roomId, mapWidth, mapHeight);
        if (roomTiles.length === 0) return placed;
        
        // Calculate target furniture count based on room size
        const entityCount = this.countEntitiesInRoom(roomTiles, entityOccupiedTiles);
        const targetOccupancy = this.MIN_OCCUPANCY + (this.MAX_OCCUPANCY - this.MIN_OCCUPANCY) * Random.float();
        const targetTilesOccupied = Math.floor(roomTiles.length * targetOccupancy);
        const targetFurnitureTiles = Math.max(
            this.MIN_FURNITURE_PER_ROOM, 
            targetTilesOccupied - entityCount
        );
        
        // Get furniture available for this room type
        const availableFurniture = getFurnitureForRoom(room.roomType);
        if (availableFurniture.length === 0) return placed;
        
        // Track placed tiles for this room
        const localOccupied = new Set<string>();
        let tilesPlaced = 0;
        
        // Keep placing furniture until we reach target or run out of space
        let attempts = 0;
        const maxAttempts = roomTiles.length * 3;
        
        while (tilesPlaced < targetFurnitureTiles && attempts < maxAttempts) {
            attempts++;
            
            // Select furniture weighted by weight value
            const furniture = this.selectWeightedFurniture(availableFurniture);
            
            // Try to place it
            const placement = this.tryPlaceFurniture(
                furniture, roomTiles, roomId, entityOccupiedTiles, furnitureOccupiedTiles, localOccupied
            );
            
            if (placement) {
                placed.push(placement);
                
                // Mark tiles as occupied
                const occupiedByThis = this.getFurnitureTiles(placement);
                for (const key of occupiedByThis) {
                    localOccupied.add(key);
                    furnitureOccupiedTiles.add(key);
                }
                
                tilesPlaced += occupiedByThis.length;
            }
        }
        
        return placed;
    }

    /**
     * Gets all walkable tiles in a room with wall-adjacency info.
     */
    private static getRoomTiles(
        tiles: number[][], 
        room: Room, 
        roomId: number,
        mapWidth: number,
        mapHeight: number
    ): TilePosition[] {
        const result: TilePosition[] = [];
        
        for (let y = room.y; y < room.y + room.height; y++)
            for (let x = room.x; x < room.x + room.width; x++)

                if (y >= 0 && y < mapHeight && x >= 0 && x < mapWidth) {
                    const tileValue = tiles[y][x];
                    // Walkable tiles have values > 1 (0 = wall, 1 = empty)
                    if (tileValue > 1) {
                        const isWallAdjacent = this.isAdjacentToWall(tiles, x, y, mapWidth, mapHeight);
                        result.push({ tileX: x, tileY: y, roomId, isWallAdjacent });
                    }
                }
        
        return result;
    }

    /**
     * Checks if a tile is adjacent to a wall (tile value 0 or 1).
     */
    private static isAdjacentToWall(
        tiles: number[][],  x: number,  y: number, width: number, height: number
    ): boolean {
        const directions = [ [-1, 0], [1, 0], [0, -1], [0, 1] ];
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            // Edge of map counts as wall
            if (nx < 0 || nx >= width || ny < 0 || ny >= height)
                return true;
            
            // Wall tiles (0 or 1)
            if (tiles[ny][nx] <= 1)
                return true;
        }
        
        return false;
    }

    /**
     * Counts entities already placed in this room's tiles.
     */
    private static countEntitiesInRoom(
        roomTiles: TilePosition[], occupiedTiles: Set<string>
    ): number {
        let count = 0;
        for (const tile of roomTiles) {
            const key = `${tile.tileX},${tile.tileY}`;
            if (occupiedTiles.has(key)) count++;
        }
        return count;
    }

    /**
     * Selects furniture weighted by the weight property.
     */
    private static selectWeightedFurniture(furniture: FurnitureDefinition[]): FurnitureDefinition {
        const totalWeight = furniture.reduce((sum, f) => sum + f.weight, 0);
        let random = Random.float() * totalWeight;
        
        for (const f of furniture) {
            random -= f.weight;
            if (random <= 0) return f;
        }
        
        return furniture[furniture.length - 1];
    }

    /**
     * Attempts to place furniture in the room.
     */
    private static tryPlaceFurniture(
        furniture: FurnitureDefinition, roomTiles: TilePosition[], roomId: number,
        entityOccupied: Set<string>, furnitureOccupied: Set<string>, localOccupied: Set<string>
    ): PlacedFurniture | null {
        // Filter tiles based on furniture requirements
        let candidates = roomTiles.filter(t => {
            const key = `${t.tileX},${t.tileY}`;
            return !entityOccupied.has(key) && 
                   !furnitureOccupied.has(key) && 
                   !localOccupied.has(key);
        });
        
        // Prefer wall-adjacent tiles for wall-aligned furniture
        if (furniture.wallAligned) {
            const wallTiles = candidates.filter(t => t.isWallAdjacent);
            if (wallTiles.length > 0)
                candidates = wallTiles;
        }
        
        if (candidates.length === 0) return null;
        
        // Shuffle candidates for randomness
        const shuffled = Random.shuffle(candidates);
        
        for (const candidate of shuffled) {
            if (furniture.size === '1x1') {
                // Simple 1x1 placement
                return { furniture, tileX: candidate.tileX, tileY: candidate.tileY, roomId };

            } else {
                // Multi-tile furniture needs contiguous tiles
                const placement = this.tryPlaceMultiTile(
                    furniture, candidate, roomId, roomTiles, entityOccupied, furnitureOccupied, localOccupied
                );
                if (placement) return placement;
            }
        }
        
        return null;
    }

    /**
     * Tries to place multi-tile furniture.
     */
    private static tryPlaceMultiTile(
        furniture: FurnitureDefinition, startTile: TilePosition, roomId: number, roomTiles: TilePosition[],
        entityOccupied: Set<string>, furnitureOccupied: Set<string>, localOccupied: Set<string>
    ): PlacedFurniture | null {
        const isOccupied = (x: number, y: number) => {
            const key = `${x},${y}`;
            return entityOccupied.has(key) || furnitureOccupied.has(key) || localOccupied.has(key);
        };
        
        const isInRoom = (x: number, y: number) => {
            return roomTiles.some(t => t.tileX === x && t.tileY === y);
        };
        
        if (furniture.size === '2x1') {
            // Horizontal: try right first
            const rightX = startTile.tileX + 1;
            if (isInRoom(rightX, startTile.tileY) && !isOccupied(rightX, startTile.tileY))
                return { furniture, tileX: startTile.tileX, tileY: startTile.tileY, roomId, orientation: 'horizontal' };
            
            // Try left
            const leftX = startTile.tileX - 1;
            if (isInRoom(leftX, startTile.tileY) && !isOccupied(leftX, startTile.tileY))
                return { furniture, tileX: leftX, tileY: startTile.tileY, roomId, orientation: 'horizontal' };

        } else if (furniture.size === '1x2') {
            // Vertical: try down first
            const downY = startTile.tileY + 1;
            if (isInRoom(startTile.tileX, downY) && !isOccupied(startTile.tileX, downY))
                return { furniture, tileX: startTile.tileX, tileY: startTile.tileY, roomId, orientation: 'vertical' };
            
            // Try up
            const upY = startTile.tileY - 1;
            if (isInRoom(startTile.tileX, upY) && !isOccupied(startTile.tileX, upY))
                return { furniture, tileX: startTile.tileX, tileY: upY, roomId, orientation: 'vertical' };
        }
        
        return null;
    }

    /**
     * Gets all tile keys occupied by a placed furniture.
     */
    static getFurnitureTiles(placement: PlacedFurniture): string[] {
        const tiles: string[] = [];
        const { furniture, tileX, tileY } = placement;
        
        tiles.push(`${tileX},${tileY}`);
        
        if (furniture.size === '2x1')
            tiles.push(`${tileX + 1},${tileY}`);
        
        else if (furniture.size === '1x2')
            tiles.push(`${tileX},${tileY + 1}`);
        
        return tiles;
    }

    /**
     * Check if furniture at a position can accept an NPC overlay.
     */
    static canAcceptNPC(furniture: FurnitureDefinition): boolean {
        return furniture.overlap === OverlapType.NPC_ONLY || 
               furniture.overlap === OverlapType.BOTH;
    }

    /**
     * Check if furniture at a position can accept a weapon overlay.
     */
    static canAcceptWeapon(furniture: FurnitureDefinition): boolean {
        return furniture.overlap === OverlapType.WEAPON_ONLY || 
               furniture.overlap === OverlapType.BOTH;
    }
}

export default FurnitureGenerator;
