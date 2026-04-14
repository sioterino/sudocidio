// generators/MapGenerator.ts
import Random from '../core/random.core';
import LayoutGenerator from './layout.generator';
import RoomMerger from './utils/room.merger';
import RoomTypeAssigner from './utils/room.assigner';
import TilemapBuilder from './tilemap.builder';
import EntityGenerator from './entity.generator';
import FurnitureGenerator from './furniture.generator';
import type { MapData } from '../types/interfaces';

/**
 * Main orchestrator for procedural map generation.
 * 
 * Coordinates all sub-generators to produce complete, playable maps
 * with rooms, boundaries, and metadata.
 * 
 * @author System Architect
 * 
 * Workflow
 * 1. Initialize random seed
 * 2. Generate layout grid
 * 3. Create initial room groups (one per cell)
 * 4. Merge adjacent groups to create larger rooms
 * 5. Assign unique room types to each group
 * 6. Build tilemap and room metadata
 * 7. Return complete map data
 * 
 * @example
 * ```typescript
 * // Generate a map with random seed
 * const mapData: MapData = MapGenerator.generate();
 * 
 * // Generate a deterministic map from a string seed
 * const sameMap: MapData = MapGenerator.generate('my-seed-123');
 * 
 * // Access map data
 * console.log(mapData.tiles);     // 2D tile array
 * console.log(mapData.rooms);      // Room metadata
 * console.log(mapData.seed);       // Used seed for regeneration
 * ```
 * 
 * @see {@link Random} For seed management
 * @see {@link LayoutGenerator} For grid generation
 * @see {@link RoomMerger} For room merging logic
 * @see {@link RoomTypeAssigner} For type assignment
 * @see {@link TilemapBuilder} For tilemap construction
 */
class MapGenerator {

    /**
     * Generates a complete procedurally generated map.
     * Can be called with or without a seed for deterministic results.
     * 
     * @param {string | number} [seed] - Optional seed for deterministic generation
     * @returns MapData Complete map data including tiles, rooms, and dimensions
     * 
     * @throws Error if any sub-generator fails (propagated from dependencies)
     * 
     * @example
     * ```typescript
     * // Random generation
     * const randomMap: MapData = MapGenerator.generate();
     * 
     * // Deterministic generation
     * const seedMap: MapData = MapGenerator.generate('dungeon-2024');
     * 
     * // Regenerate same map
     * const sameMap: MapData = MapGenerator.generate(randomMap.seed);
     * ```
     */
    static generate(seed?: string | number): MapData {
        const finalSeed = Random.seed(seed);
        
        // step 1: generate layout
        const layout = LayoutGenerator.generate();
        
        // step 2: create initial room groups
        let groups = LayoutGenerator.createInitialGroups(layout.rows, layout.cols);
        
        // step 3: merge rooms
        groups = RoomMerger.merge(groups, layout.rows, layout.cols);
        
        // step 4: assign room types
        RoomTypeAssigner.assign(groups);
        
        // step 5: build tilemap
        const { tiles, rooms } = TilemapBuilder.build(layout, groups);
        
        const width = layout.cols * layout.cellWidth;
        const height = layout.rows * layout.cellHeight;
        
        // step 6: generate entities (suspects, victim, weapons)
        const entities = EntityGenerator.generate(tiles, rooms, width, height);
        
        // step 7: generate furniture in rooms
        // Build set of occupied tiles from entities
        const occupiedTiles = new Set<string>();

        for (const placed of entities.suspects) 
            occupiedTiles.add(`${placed.tileX},${placed.tileY}`);
        
        for (const placed of entities.weapons) 
            occupiedTiles.add(`${placed.tileX},${placed.tileY}`);
        
        occupiedTiles.add(`${entities.victim.tileX},${entities.victim.tileY}`);
        
        const furniture = FurnitureGenerator.generate(tiles, rooms, width, height, occupiedTiles);
        
        return {
            tiles,
            rooms,
            width,
            height,
            seed: finalSeed,
            entities,
            furniture
        };
    }
}

export default MapGenerator
