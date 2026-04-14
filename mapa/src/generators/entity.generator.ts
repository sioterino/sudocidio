/**
 * Generates and positions game entities (suspects, victim, weapons) on the map.
 *
 * Placement rules:
 * 1. Suspects + victim share a combined row/col exclusion pool — no two NPCs
 *    (suspect or victim) may share a row or column.
 * 2. Weapons have their own row/col exclusion pool — no two weapons may share
 *    a row or column.
 * 3. A weapon and an NPC CAN share a row or column.
 * 4. A weapon and an NPC CANNOT occupy the same tile.
 * 5. Each suspect is paired with exactly one weapon.
 * 6. NUM_SUSPECTS = min(mapWidth, mapHeight) - 1
 *    → total NPCs on the board = NUM_SUSPECTS + 1 (victim)  = min(w,h)
 *    → total weapons            = NUM_SUSPECTS
 * 7. The murder room contains: the murderer, the killing weapon, and the victim.
 *    The victim must satisfy the NPC row/col constraint against ALL suspects
 *    (including the murderer).
 *    Other suspects/weapons MAY ALSO be placed in the murder room.
 * 8. The murderer is the suspect in the same room as the victim who also has
 *    their weapon in that room.
 * 9. Weapons cannot share rows with the victim (but can share rows with suspects/murderer).
 * 10. Weapons cannot share rows with other weapons.
 *
 * @author System Architect
 */

import Random from '../core/random.core';
import type { Room } from '../types/interfaces';
import { Weapon, Suspect, Victim, PlacedEntity, GameEntities, WEAPONS_REGISTRY, SUSPECTS_REGISTRY, VICTIMS_REGISTRY } from '../types/npc.registry';

interface TilePosition {
    tileX: number;
    tileY: number;
    roomId: number;
}

class EntityGenerator {

    /**
     * Generates all game entities and their positions on the map.
     *
     * @param tiles  - 2D array of tile indices
     * @param rooms  - Array of room metadata
     * @param width  - Map width  in tiles
     * @param height - Map height in tiles
     * @returns GameEntities with all positioned entities
     */
    static generate(tiles: number[][], rooms: Room[], width: number, height: number): GameEntities {

        // ── 0. Derive counts from map dimensions ──────────────────────────────
        const numSuspects = Math.min(width, height) - 1; // rule 6
        // Total NPCs = numSuspects + 1 victim  →  needs min(w,h) unique rows & cols

        // ── 1. Collect every walkable tile together with its room id ───────────
        const validTiles = this.getValidTiles(tiles, rooms, width, height);

        if (validTiles.length < numSuspects * 2 + 1) {
            throw new Error(
                `Not enough valid tiles (${validTiles.length}) for ` +
                `${numSuspects} suspects + ${numSuspects} weapons + 1 victim.`
            );
        }

        // ── 2. Pick suspects, weapons, victim from registries ─────────────────
        const selectedSuspects = this.selectRandomSuspects(numSuspects);
        const selectedWeapons  = this.selectRandomWeapons(numSuspects);
        const victim           = this.selectRandomVictim();

        // Pair each suspect with a weapon
        const suspectsWithWeapons = this.associateWeapons(selectedSuspects, selectedWeapons);

        // ── 3. Choose the murderer ────────────────────────────────────────────
        const murdererIndex          = Random.int(0, numSuspects - 1);
        suspectsWithWeapons[murdererIndex].role = 'murderer';
        selectedWeapons[murdererIndex].isKillingWeapon = true;

        const murderer     = suspectsWithWeapons[murdererIndex];
        const killingWeapon = selectedWeapons[murdererIndex];

        // ── 4. Place entities ─────────────────────────────────────────────────
        const { placedSuspects, placedWeapons, placedVictim } =
            this.positionEntities(suspectsWithWeapons, selectedWeapons, murdererIndex, victim, validTiles);

        return { suspects: placedSuspects, victim: placedVictim, weapons: placedWeapons, murderer, killingWeapon };
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Tile helpers
    // ══════════════════════════════════════════════════════════════════════════

    private static getValidTiles(tiles: number[][], rooms: Room[], width: number, height: number): TilePosition[] {

        const valid: TilePosition[] = [];
        for (let y = 0; y < height; y++)
            for (let x = 0; x < width; x++)
                if (tiles[y][x] > 1) {
                    const roomId = this.getRoomIdForTile(x, y, rooms);
                    if (roomId !== -1) valid.push({ tileX: x, tileY: y, roomId });
                }

        return valid;
    }

    private static getRoomIdForTile(x: number, y: number, rooms: Room[]): number {
        for (let i = 0; i < rooms.length; i++) {
            const r = rooms[i];
            if (x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height)
                return i;
        }
        return -1;
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Registry helpers
    // ══════════════════════════════════════════════════════════════════════════

    private static selectRandomSuspects(n: number): Suspect[] {
        return Random.shuffle(SUSPECTS_REGISTRY)
            .slice(0, n)
            .map(s => ({ ...s, role: 'suspect' as const, weapon: null }));
    }

    private static selectRandomWeapons(n: number): Weapon[] {
        return Random.shuffle(WEAPONS_REGISTRY)
            .slice(0, n)
            .map(w => ({ ...w, isKillingWeapon: false }));
    }

    private static associateWeapons(suspects: Suspect[], weapons: Weapon[]): Suspect[] {
        return suspects.map((s, i) => ({ ...s, weapon: weapons[i] }));
    }

    private static selectRandomVictim(): Victim {
        return { ...Random.pick(VICTIMS_REGISTRY), role: 'victim' as const };
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Core placement
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * Places all entities while satisfying every constraint.
     *
     * Strategy
     * ────────
     * A. Shuffle all valid tiles once for randomness.
     * B. Find rooms that have enough tiles to place the murder scene.
     * C. In the chosen murder room, place:
     *      murderer, killingWeapon, victim (they don't need exclusive use of the room)
     * D. Fill remaining suspects (not murderer) with the NPC constraint pool.
     * E. Fill remaining weapons with priority:
     *    1. First on rows/columns that have NO entities (suspects or victim)
     *    2. Then on any remaining valid tiles (weapon row constraint still applies)
     */
    private static positionEntities(
        suspects: Suspect[], weapons: Weapon[], murdererIndex: number, victim: Victim, validTiles: TilePosition[]
    ): {
        placedSuspects: PlacedEntity[];
        placedWeapons:  PlacedEntity[];
        placedVictim:   PlacedEntity;
    } {
        const shuffled = Random.shuffle(validTiles);

        // Shared state ---------------------------------------------------------
        const usedNpcRows    = new Set<number>(); // suspects + victim
        const usedNpcCols    = new Set<number>();
        const usedWeaponRows = new Set<number>(); // Weapons cannot share rows with each other
        const usedTiles      = new Set<string>();  // no two entities on same tile

        const placedSuspects: PlacedEntity[] = [];
        const placedWeapons:  PlacedEntity[] = [];
        let   placedVictim!:  PlacedEntity;

        const key = (t: TilePosition) => `${t.tileX},${t.tileY}`;

        // Helper: claim a tile for an NPC
        const claimNpc = (t: TilePosition, entity: Suspect | Victim, type: 'suspect' | 'victim') => {
            usedNpcRows.add(t.tileY);
            usedNpcCols.add(t.tileX);
            usedTiles.add(key(t));
            return { entity, tileX: t.tileX, tileY: t.tileY, roomId: t.roomId, type } as PlacedEntity;
        };

        // Helper: claim a tile for a weapon
        const claimWeapon = (t: TilePosition, entity: Weapon) => {
            usedWeaponRows.add(t.tileY);
            usedTiles.add(key(t));
            return { entity, tileX: t.tileX, tileY: t.tileY, roomId: t.roomId, type: 'weapon' } as PlacedEntity;
        };

        // ── A. Find suitable murder room ──────────────────────────────────────
        // We need a room with at least 3 distinct tiles for the murder scene.
        // These tiles don't need to be exclusive - other entities can be placed
        // in the same room later.
        
        const roomIds = this.findRoomsWithMinTiles(shuffled, 3);
        if (roomIds.length === 0)
            throw new Error('No room has ≥ 3 walkable tiles — cannot place murder scene.');

        const shuffledRoomIds = Random.shuffle(roomIds);
        let murderScenePlaced = false;
        let murderRoomId = -1;

        for (const roomId of shuffledRoomIds) {
            const roomTiles = shuffled.filter(t => t.roomId === roomId);

            // Try to find distinct tiles for murderer, weapon, and victim
            // We don't need to temporarily claim them - we'll commit if we find all three
            let murdererTile: TilePosition | undefined;
            let weaponTile: TilePosition | undefined;
            let victimTile: TilePosition | undefined;
            
            // Search for three distinct tiles that satisfy constraints
            for (const candidateMurderer of roomTiles) {
                // Check murderer NPC constraints
                if (usedNpcRows.has(candidateMurderer.tileY) || usedNpcCols.has(candidateMurderer.tileX)) {
                    continue;
                }
                
                for (const candidateWeapon of roomTiles) {
                    if (key(candidateWeapon) === key(candidateMurderer)) continue;
                    // Check weapon constraints (no weapon row conflict)
                    if (usedWeaponRows.has(candidateWeapon.tileY)) continue;
                    
                    for (const candidateVictim of roomTiles) {
                        if (key(candidateVictim) === key(candidateMurderer) || 
                            key(candidateVictim) === key(candidateWeapon)) continue;
                        // Check victim NPC constraints against murderer
                        if (candidateVictim.tileY === candidateMurderer.tileY || 
                            candidateVictim.tileX === candidateMurderer.tileX) continue;
                        
                        // Found a valid combination
                        murdererTile = candidateMurderer;
                        weaponTile = candidateWeapon;
                        victimTile = candidateVictim;
                        break;
                    }
                    if (victimTile) break;
                }
                if (victimTile) break;
            }
            
            if (murdererTile && weaponTile && victimTile) {
                // Commit the murder scene placement
                placedSuspects.push(claimNpc(murdererTile, suspects[murdererIndex], 'suspect'));
                placedWeapons.push(claimWeapon(weaponTile, weapons[murdererIndex]));
                placedVictim = claimNpc(victimTile, victim, 'victim');
                murderRoomId = roomId;
                murderScenePlaced = true;
                break;
            }
        }

        if (!murderScenePlaced)
            throw new Error('Could not place murder scene (murderer + weapon + victim) in any room.');

        // ── B. Place remaining suspects ───────────────────────────────────────
        // These CAN be placed in the murder room or any other room
        for (let i = 0; i < suspects.length; i++) {
            if (i === murdererIndex) continue; // already placed

            const tile = shuffled.find(t =>
                !usedTiles.has(key(t)) &&
                !usedNpcRows.has(t.tileY) &&
                !usedNpcCols.has(t.tileX)
                // No restriction on room - can be murder room or any other
            );

            if (!tile) {
                console.warn(`Could not place suspect "${suspects[i].name}" — no valid tile.`);
                continue;
            }

            placedSuspects.push(claimNpc(tile, suspects[i], 'suspect'));
        }

        // ── C. Place remaining weapons with priority system ────────────────────
        // Priority 1: Place weapons on rows/columns that have NO entities (suspects or victim)
        // Priority 2: Place remaining weapons anywhere that satisfies weapon row constraint
        
        const remainingWeapons = weapons.filter((_, i) => i !== murdererIndex);
        
        // Track which rows/columns have entities (NPCs)
        const rowsWithEntities = new Set(usedNpcRows);
        const colsWithEntities = new Set(usedNpcCols);
        
        // Weapons cannot share rows with victim
        const victimRow = placedVictim.tileY;
        
        // First pass: try to place on rows without any entities AND not victim's row
        const priorityTiles = shuffled.filter(t => 
            !usedTiles.has(key(t)) && // Not used
            !usedWeaponRows.has(t.tileY) && // No weapon in this row yet
            t.tileY !== victimRow && // Cannot share row with victim
            !rowsWithEntities.has(t.tileY) && // No suspect/murderer in this row
            !colsWithEntities.has(t.tileX) // No suspect/murderer in this column
        );
        
        // Shuffle priority tiles for randomness
        const shuffledPriority = Random.shuffle(priorityTiles);
        
        // Place as many weapons as possible in priority locations
        let priorityIndex = 0;
        for (let i = 0; i < remainingWeapons.length && priorityIndex < shuffledPriority.length; i++) {
            const tile = shuffledPriority[priorityIndex++];
            const weapon = remainingWeapons[i];
            
            placedWeapons.push(claimWeapon(tile, weapon));
        }
        
        // Second pass: place remaining weapons anywhere that satisfies:
        // - Not used tile
        // - Not sharing row with other weapons
        // - Not sharing row with victim
        // Can be in murder room or any other room
        const remainingUnplacedWeapons = remainingWeapons.slice(priorityIndex);
        
        for (const weapon of remainingUnplacedWeapons) {
            const tile = shuffled.find(t =>
                !usedTiles.has(key(t)) &&
                !usedWeaponRows.has(t.tileY) && // No weapon in this row
                t.tileY !== victimRow // Cannot share row with victim
            );
            
            if (!tile) {
                console.warn(`Could not place weapon "${weapon.name}" — no valid tile.`);
                continue;
            }
            
            placedWeapons.push(claimWeapon(tile, weapon));
        }

        return { placedSuspects, placedWeapons, placedVictim };
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  Utility
    // ══════════════════════════════════════════════════════════════════════════

    private static findRoomsWithMinTiles(tiles: TilePosition[], min: number): number[] {
        const counts = new Map<number, number>();
        for (const t of tiles) counts.set(t.roomId, (counts.get(t.roomId) ?? 0) + 1);
        const result: number[] = [];
        counts.forEach((count, id) => { if (count >= min) result.push(id); });
        return result;
    }
}

export default EntityGenerator;