/**
 * Generates contextual hints for placed entities (suspects and weapons).
 *
 * Hint ordering follows the micro → macro principle:
 *   easy   = precise spatial info  (adjacent furniture, exact direction)
 *   medium = room-level info       (same room as X, alone/not alone)
 *   hard   = negative/vague info   (not in bathroom, X rooms are empty)
 *
 * The initial set surfaces one hard hint per suspect so the game starts
 * fair — players must request more hints to get precise information.
 *
 * @author System Architect
 */

import Random from '../core/random.core';
import type { Room } from '../types/interfaces';
import type { PlacedEntity, GameEntities } from '../types/npc.registry';
import type { PlacedFurniture } from '../types/furniture.registry';
import { RoomTypeMetaMap } from '../types/interfaces';

// ─── Public types ────────────────────────────────────────────────────────────

export type HintLevel = 'easy' | 'medium' | 'hard';

export interface Hint {
    /** Target entity this hint is about */
    entityName: string;
    /** Entity kind for labelling in the UI */
    entityType: 'suspect' | 'weapon';
    level: HintLevel;
    text: string;
}

export interface EntityHintSet {
    entity: PlacedEntity;
    /** Shown immediately at game start */
    initialHint: Hint;
    /** Ordered easy → more-easy → medium → hard, revealed on demand */
    furtherHints: Hint[];
}

// ─── HintGenerator ──────────────────────────────────────────────────────────

class HintGenerator {

    // ── Public API ─────────────────────────────────────────────────────────

    /**
     * Builds the initial hint set shown when the game starts.
     * Returns one hard hint per suspect (not for weapons — those are
     * only surfaced via getNextHint).
     *
     * @param entities  Full GameEntities output from EntityGenerator
     * @param furniture Full PlacedFurniture array from FurnitureGenerator
     * @param rooms     Room metadata array
     */
    static getInitialHints(
        entities: GameEntities,
        furniture: PlacedFurniture[],
        rooms: Room[]
    ): EntityHintSet[] {
        return entities.suspects.map(suspect => {
            const ladder = this.buildLadder(suspect, 'suspect', entities, furniture, rooms);
            // Initial hint is the hardest (most vague) — macro first
            const initialHint = ladder.find(h => h.level === 'hard') ?? ladder[ladder.length - 1];
            const furtherHints = ladder.filter(h => h !== initialHint);
            return { entity: suspect, initialHint, furtherHints };
        });
    }

    /**
     * Returns a single hint for a random entity that has not yet been
     * positioned on the map by the player.
     *
     * Call this when the player clicks "nova dica!".
     * The level is randomly weighted toward medium/hard so that hints
     * don't trivially solve the puzzle.
     *
     * @param entities        Full GameEntities
     * @param furniture       Full PlacedFurniture array
     * @param rooms           Room metadata
     * @param unplacedEntities Set of entity names the player hasn't placed yet
     */
    static getNextHint(
        entities: GameEntities,
        furniture: PlacedFurniture[],
        rooms: Room[],
        unplacedEntities?: Set<string>
    ): Hint | null {
        const candidates: { entity: PlacedEntity; type: 'suspect' | 'weapon' }[] = [
            ...entities.suspects.map(e => ({ entity: e, type: 'suspect' as const })),
            ...entities.weapons.map(e => ({ entity: e, type: 'weapon' as const })),
        ].filter(c =>
            !unplacedEntities || unplacedEntities.has(c.entity.entity.name)
        );

        if (candidates.length === 0) return null;

        const { entity, type } = Random.pick(candidates);
        const ladder = this.buildLadder(entity, type, entities, furniture, rooms);

        // Weight: 20% easy, 50% medium, 30% hard
        const roll = Random.float();
        const wantedLevel: HintLevel = roll < 0.2 ? 'easy' : roll < 0.7 ? 'medium' : 'hard';
        return ladder.find(h => h.level === wantedLevel) ?? Random.pick(ladder);
    }

    /**
     * Returns the full ordered hint ladder for a single entity.
     * Useful if you want to render a progressive-disclosure UI.
     *
     * Order: easy (most specific) → medium → hard (most vague)
     */
    static getFullLadder(
        entity: PlacedEntity,
        type: 'suspect' | 'weapon',
        entities: GameEntities,
        furniture: PlacedFurniture[],
        rooms: Room[]
    ): Hint[] {
        return this.buildLadder(entity, type, entities, furniture, rooms);
    }

    // ── Hint ladder builder ────────────────────────────────────────────────

    private static buildLadder(
        entity: PlacedEntity,
        type: 'suspect' | 'weapon',
        entities: GameEntities,
        furniture: PlacedFurniture[],
        rooms: Room[]
    ): Hint[] {
        const hints: Hint[] = [];
        const name = entity.entity.name;
        const room = rooms[entity.roomId];
        const roomName = room ? RoomTypeMetaMap[room.roomType].name : 'cômodo desconhecido';
        const allNPCs = [...entities.suspects, entities.victim];

        // ── EASY 1: adjacent furniture with direction ──────────────────────
        const adjacent = this.getAdjacentFurniture(entity, furniture, 1);
        if (adjacent.length > 0) {
            const f = adjacent[0];
            const dir = this.relativeDirection(entity, f);
            hints.push(this.hint(name, type, 'easy',
                `${name} está ${dir} um(a) ${f.furniture.name}.`
            ));
        }

        // ── EASY 2: nearby furniture (radius 2) ────────────────────────────
        const nearby = this.getAdjacentFurniture(entity, furniture, 2)
            .filter(f => !adjacent.includes(f));
        if (nearby.length > 0) {
            hints.push(this.hint(name, type, 'easy',
                `${name} está próximo(a) de um(a) ${nearby[0].furniture.name}.`
            ));
        }

        // ── EASY 3: shares room with specific furniture ────────────────────
        const roomFurniture = furniture.filter(f => f.roomId === entity.roomId);
        if (roomFurniture.length > 0) {
            const uniqueNames = [...new Set(roomFurniture.map(f => f.furniture.name))].slice(0, 2);
            hints.push(this.hint(name, type, 'easy',
                `${name} está no mesmo cômodo que um(a) ${uniqueNames.join(' e um(a) ')}.`
            ));
        }

        // ── MEDIUM 1: alone or with whom ──────────────────────────────────
        const roommates = allNPCs.filter(e =>
            e.roomId === entity.roomId && e.entity.name !== name
        );
        if (roommates.length > 0) {
            const names = roommates.map(r => r.entity.name).join(' e ');
            hints.push(this.hint(name, type, 'medium',
                `${name} não está sozinho(a) — divide o cômodo com ${names}.`
            ));
        } else {
            hints.push(this.hint(name, type, 'medium',
                `${name} está sozinho(a) no cômodo.`
            ));
        }

        // ── MEDIUM 2: weapon-specific — is it on furniture? ───────────────
        if (type === 'weapon') {
            const onFurniture = furniture.find(f =>
                f.tileX === entity.tileX && f.tileY === entity.tileY
            );
            if (onFurniture) {
                hints.push(this.hint(name, type, 'medium',
                    `${name} está em cima de um(a) ${onFurniture.furniture.name}.`
                ));
            }
        }

        // ── MEDIUM 3: same room as its paired suspect (weapons only) ──────
        if (type === 'weapon') {
            const paired = entities.suspects.find(s =>
                (s.entity as any).weapon?.name === name
            );
            if (paired) {
                const sameRoom = paired.roomId === entity.roomId;
                hints.push(this.hint(name, type, 'medium',
                    sameRoom
                        ? `${name} está no mesmo cômodo que seu portador.`
                        : `${name} não está no mesmo cômodo que seu portador.`
                ));
            }
        }

        // ── HARD 1: room name ─────────────────────────────────────────────
        hints.push(this.hint(name, type, 'hard',
            `${name} está ${this.artigo(roomName)} ${roomName}.`
        ));

        // ── HARD 2: negative exclusion (rooms it's NOT in) ────────────────
        const otherRooms = rooms
            .filter((_, index) => index !== entity.roomId) // Use array index instead of .id
            .map(r => RoomTypeMetaMap[r.roomType].name);
        if (otherRooms.length >= 2) {
            const sample = otherRooms.slice(0, 2);
            hints.push(this.hint(name, type, 'hard',
                `${name} não está ${this.artigo(sample[0])} ${sample[0]} nem ${this.artigo(sample[1])} ${sample[1]}.`
            ));
        }

        // ── HARD 3: global emptiness hint ─────────────────────────────────
        const occupiedRoomIds = new Set(allNPCs.map(e => e.roomId));
        const emptyCount = rooms.filter((_, index) => !occupiedRoomIds.has(index)).length;
        if (emptyCount > 0) {
            hints.push(this.hint(name, type, 'hard',
                `Há ${emptyCount} cômodo(s) na casa sem nenhum suspeito ou vítima.`
            ));
        }

        return hints;
    }

    // ── Spatial helpers ───────────────────────────────────────────────────

    private static getAdjacentFurniture(
        entity: PlacedEntity,
        furniture: PlacedFurniture[],
        radius: number
    ): PlacedFurniture[] {
        return furniture.filter(f =>
            Math.abs(f.tileX - entity.tileX) <= radius &&
            Math.abs(f.tileY - entity.tileY) <= radius &&
            !(f.tileX === entity.tileX && f.tileY === entity.tileY)
        );
    }

    private static relativeDirection(from: PlacedEntity, to: PlacedFurniture): string {
        const dx = to.tileX - from.tileX;
        const dy = to.tileY - from.tileY;
        if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'à direita de' : 'à esquerda de';
        return dy > 0 ? 'abaixo de' : 'acima de';
    }

    // ── Portuguese grammar helpers ────────────────────────────────────────

    /** Returns the correct preposition+article contraction for room names. */
    private static artigo(roomName: string): string {
        const feminine = ['sala', 'garagem', 'cozinha', 'área de serviço'];
        return feminine.some(f => roomName.startsWith(f)) ? 'na' : 'no';
    }

    // ── Factory ───────────────────────────────────────────────────────────

    private static hint(
        entityName: string,
        entityType: 'suspect' | 'weapon',
        level: HintLevel,
        text: string
    ): Hint {
        return { entityName, entityType, level, text };
    }
}

export default HintGenerator;