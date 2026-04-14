import { PlacedFurniture } from './furniture.registry';
import type { GameEntities } from './npc.registry'

/**
 * Core type definitions for the procedural map generation system.
 * Defines the data structures used across all generators for type safety
 * and consistent data flow.
 * 
 * @module Types
 * @author System Architect
 * 
 */

/**
 * Enumeration of all possible room types in the generated map.
 * 
 * Values correspond to tile indices in the tileset (2-8).
 * Tile 0: Wall, Tile 1: Empty/Unused
 * 
 * @enum {number}
 */
export enum RoomType {
    /** <Bedroom> Residential sleeping area, tile index 2 */
    BEDROOM = 2,
    /** <Office> Workspace/study area, tile index 3 */
    OFFICE = 3,
    /** <Bathroom> Sanitary facilities, tile index 4 */
    BATHROOM = 4,
    /** <Kitchen> Food preparation area, tile index 5 */
    KITCHEN = 5,
    /** <Living Room> Common social area, tile index 6 */
    LIVING_ROOM = 6,
    /** <Garage> Vehicle storage area, tile index 7 */
    GARAGE = 7,
    /** <Yard> Outdoor green space, tile index 8 */
    YARD = 8
}

/**
 * Metadata definition for a {@link RoomType}.
 *
 * This structure encapsulates all human-readable and descriptive
 * information associated with a room type, separating presentation
 * concerns from the core enum values.
 *
 * @remarks
 * Using a metadata layer instead of embedding logic (e.g. switch/case)
 * allows for:
 * - Centralized configuration
 * - Easier localization (i18n)
 * - Future extensibility (icons, colors, gameplay properties, etc.)
 * - Strong type safety via `Record<RoomType, ...>`
 *
 * @example
 * ```ts
 * const name = RoomTypeMetaMap[RoomType.BEDROOM].name;
 * // "quarto"
 * ```
 */
type RoomTypeMeta = {
    /** Localized display name of the room type */
    name: string;
    /** Path to the tile texture */
    texturePath: string;
    /** Path to the highlight texture */
    highlightPath: string;
    /** Tile index in the tileset */
    tileIndex: number;
    /** Highlight tile index in the tileset */
    highlightIndex: number;
};

/**
 * Lookup table mapping each {@link RoomType} to its corresponding metadata.
 *
 * @example Basic usage
 * ```ts
 * const roomType = RoomType.BATHROOM;
 * const label = RoomTypeMetaMap[roomType].name;
 * // "banheiro"
 * ```
 *
 * @example Iteration
 * ```ts
 * for (const type in RoomTypeMetaMap) {
 *     const meta = RoomTypeMetaMap[type as unknown as RoomType];
 *     console.log(meta.name);
 * }
 * ```
 */
export const RoomTypeMetaMap: Record<RoomType, RoomTypeMeta> = {
    [RoomType.BEDROOM]: { 
        name: 'quarto', 
        texturePath: '/assets/floor/parquet.png',
        highlightPath: '/assets/floor/parquet.png',
        tileIndex: RoomType.BEDROOM,
        highlightIndex: 10
    },
    [RoomType.OFFICE]: { 
        name: 'escritório', 
        texturePath: '/assets/floor/wooden.png',
        highlightPath: '/assets/floor/wooden.png',
        tileIndex: RoomType.OFFICE,
        highlightIndex: 11
    },
    [RoomType.BATHROOM]: { 
        name: 'banheiro', 
        texturePath: '/assets/floor/tiles.png',
        highlightPath: '/assets/floor/tiles.png',
        tileIndex: RoomType.BATHROOM,
        highlightIndex: 12
    },
    [RoomType.KITCHEN]: { 
        name: 'cozinha', 
        texturePath: '/assets/floor/squared.png',
        highlightPath: '/assets/floor/squared.png',
        tileIndex: RoomType.KITCHEN,
        highlightIndex: 13
    },
    [RoomType.LIVING_ROOM]: { 
        name: 'sala', 
        texturePath: '/assets/floor/wooden.png',
        highlightPath: '/assets/floor/wooden.png',
        tileIndex: RoomType.LIVING_ROOM,
        highlightIndex: 14
    },
    [RoomType.GARAGE]: { 
        name: 'garagem', 
        texturePath: '/assets/floor/bricks.png',
        highlightPath: '/assets/floor/bricks.png',
        tileIndex: RoomType.GARAGE,
        highlightIndex: 15
    },
    [RoomType.YARD]: { 
        name: 'jardim', 
        texturePath: '/assets/grass/grass.png',
        highlightPath: '/assets/grass/grass.png',
        tileIndex: RoomType.YARD,
        highlightIndex: 16
    },
};

/**
 * Represents a single cell in the grid-based room layout.
 * 
 * Used during the room generation phase before pixel-level mapping.
 * 
 * @interface GridCell
 */
export interface GridCell {
    /** Row index in the layout grid (0-based from top) */
    row: number;
    /** Column index in the layout grid (0-based from left) */
    col: number;
}

/**
 * Defines the rectangular grid structure for room placement.
 * 
 * Each cell in the grid will become a room or part of a merged room group.
 * 
 * @interface Layout
 */
export interface Layout {
    /** Number of columns in the grid (horizontal room slots) */
    cols: number;
    /** Number of rows in the grid (vertical room slots) */
    rows: number;
    /** Width in pixels of each grid cell */
    cellWidth: number;
    /** Height in pixels of each grid cell */
    cellHeight: number;
}

/**
 * Represents a group of grid cells that form a single room.
 * Used during the merging phase where multiple cells combine into larger rooms.
 * 
 * @interface RoomGroup
 */
export interface RoomGroup {
    /** Unique identifier for this room group */
    id: number;
    /** Array of grid cells belonging to this room */
    cells: GridCell[];
    /** The room type assigned to this group (null until assigned) */
    roomType: RoomType;
}

/**
 * Complete metadata for a generated room in the final map.
 * 
 * Contains both grid and pixel dimensions for rendering and gameplay logic.
 * 
 * @interface Room
 */
export interface Room {
    /** X-coordinate in pixels (left edge of room) */
    x: number;
    /** Y-coordinate in pixels (top edge of room) */
    y: number;
    /** Width in pixels of the room */
    width: number;
    /** Height in pixels of the room */
    height: number;
    /** Type of room (Quarto, Sala, etc.) */
    roomType: RoomType;
    /** Grid cells that compose this room (for spatial queries) */
    cells: GridCell[];
}

/**
 * Complete map data structure returned by the generator.
 * 
 * Contains both tile data for rendering and room metadata for game logic.
 * 
 * @interface MapData
 */
export interface MapData {
    /** 2D array of tile indices (values 0-8, where 0=wall, 1=empty, 2-8=room types) */
    tiles: number[][];
    /** Array of room metadata objects for gameplay interactions */
    rooms: Room[];
    /** Total width of the map in pixels */
    width: number;
    /** Total height of the map in pixels */
    height: number;
    /** The seed value used to generate this map (for regeneration) */
    seed: number;
    /** Game entities (suspects, victim, weapons) - optional for backward compatibility */
    entities?: GameEntities;
    /** Furniture placed in rooms - optional for backward compatibility */
    furniture?: PlacedFurniture[];
}
