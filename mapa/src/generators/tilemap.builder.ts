import { Layout, RoomGroup, Room, GridCell } from '../types/interfaces';

/**
 * Converts abstract room groups and layouts into concrete tilemap data.
 * 
 * Handles the transformation from grid-based room definitions to pixel-level
 * tile indices suitable for rendering with Phaser tilemaps.
 * 
 * @author System Architect
 * 
 * Responsibilities
 * - Generate 2D tile array from room groups
 * - Calculate pixel-perfect room boundaries
 * - Create room metadata for gameplay systems
 * - Initialize tilemap with wall tiles (type 1) before filling rooms
 * 
 * @see {@link Layout} for grid structure
 * @see {@link RoomGroup} for room definitions
 * @see {@link Room} for output metadata structure
 */
class TilemapBuilder {
    /**
     * Default tile value for empty/unused spaces.
     * Value 1 represents void/empty space in the tileset.
     * 
     * @constant
     * @private
     */
    private static readonly EMPTY_TILE = 1;

    /**
     * Builds complete tilemap and room metadata from layout and groups.
     * 
     * @param {Layout} layout - Grid dimensions and cell sizes
     * @param {RoomGroup[]} groups - Merged groups with assigned room types
     * @returns {Object} Object containing tile array and room metadata
     * @returns number[][] return.tiles - 2D array of tile indices
     * @returns Room[] return.rooms - Array of room metadata objects
     * 
     * @example
     * ```typescript
     * const { tiles, rooms } = TilemapBuilder.build(layout, groups);
     * // tiles[y][x] contains tile indices 0-8
     * // rooms contains bounding boxes and types for gameplay
     * ```
     */
    static build(layout: Layout, groups: RoomGroup[]): { tiles: number[][], rooms: Room[] } {
        const { cols, rows, cellWidth, cellHeight } = layout;
        const width = cols * cellWidth;
        const height = rows * cellHeight;
        
        // Initialize tilemap with empty/wall tiles
        const tiles: number[][] = Array.from({ length: height }, () => new Array(width).fill(this.EMPTY_TILE) );
        
        const rooms: Room[] = [];
        
        // Fill tiles with room types based on group assignments
        for (const group of groups) {
            for (const cell of group.cells)
                this.fillRoomArea(tiles, cell, layout, group.roomType);
            
            rooms.push(this.createRoomMetadata(group, layout));
        }
        
        return { tiles, rooms };
    }

    /**
     * Fills a rectangular area of the tilemap with a specific room type.
     * The area corresponds to one grid cell in the layout.
     * 
     * @param {number[][]} tiles - The tilemap to modify
     * @param {GridCell} cell - Grid cell coordinates to fill
     * @param {Layout} layout - Layout containing cell dimensions
     * @param {number} roomType - Tile index to fill with (2-8)
     * @returns void
     * 
     * @modifies number[][] tiles - Sets tile values in the specified area
     * 
     * @internal
     */
    private static fillRoomArea(tiles: number[][],  cell: GridCell,  layout: Layout,  roomType: number): void {
        const { cellWidth, cellHeight } = layout;
        const startX = cell.col * cellWidth;
        const startY = cell.row * cellHeight;
        
        for (let y = startY; y < startY + cellHeight; y++)
            for (let x = startX; x < startX + cellWidth; x++)
                tiles[y][x] = roomType;

    }

    /**
     * Creates room metadata from a room group.
     * 
     * Calculates pixel-perfect bounding box based on the group's grid cells.
     * 
     * @param {RoomGroup} group - The room group to create metadata for
     * @param {Layout} layout - Layout containing cell dimensions
     * @returns Roo} Complete room metadata with pixel dimensions
     * 
     * Algorithm
     * 1. Extract all row and column indices from group cells
     * 2. Find min/max rows and columns
     * 3. Calculate pixel coordinates from grid positions
     * 4. Calculate total width/height including all merged cells
     * 
     * @internal
     */
    private static createRoomMetadata(group: RoomGroup, layout: Layout): Room {
        const rows = group.cells.map((c: GridCell) => c.row);
        const cols = group.cells.map((c: GridCell) => c.col);
        
        const minRow = Math.min(...rows);
        const maxRow = Math.max(...rows);
        const minCol = Math.min(...cols);
        const maxCol = Math.max(...cols);
        
        return {
            x: minCol * layout.cellWidth,
            y: minRow * layout.cellHeight,
            width: (maxCol - minCol + 1) * layout.cellWidth,
            height: (maxRow - minRow + 1) * layout.cellHeight,
            roomType: group.roomType,
            cells: group.cells
        };
    }
}

export default TilemapBuilder