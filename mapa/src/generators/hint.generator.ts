/**
 * Generates contextual hints for placed entities (suspects and weapons).
 *
 * Hint ordering follows the micro → macro principle:
 *   easy   = precise spatial info  (adjacent furniture, exact direction)
 *   medium = room-level info       (same room as X, alone/not alone)
 *   hard   = negative/vague info   (not in bathroom, X rooms are empty)
 *
 * Every entity (suspect AND weapon) receives two initial hints —
 * one medium and one easy — so the opening state is solvable without
 * having to grind "nova dica!".
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
    /** Two hints shown immediately at game start (one medium + one easy) */
    initialHints: Hint[];
    /** Remaining hints revealed on demand, ordered easy → medium → hard */
    furtherHints: Hint[];
}

// ─── HintGenerator ──────────────────────────────────────────────────────────

class HintGenerator {

    // ── Public API ─────────────────────────────────────────────────────────

    /**
     * Builds the initial hint sets shown when the game starts.
     *
     * Every suspect AND weapon gets exactly two initial hints:
     *   • one at 'medium' level  (room-level info)
     *   • one at 'easy'  level   (precise spatial info)
     *
     * This gives the player enough information to make a meaningful first
     * attempt without having to request additional hints.
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
        const allEntities: { entity: PlacedEntity; type: 'suspect' | 'weapon' }[] = [
            ...entities.suspects.map(e => ({ entity: e, type: 'suspect' as const })),
            ...entities.weapons.map(e => ({ entity: e, type: 'weapon' as const })),
        ];

        return allEntities.map(({ entity, type }) => {
            const ladder = this.buildLadder(entity, type, entities, furniture, rooms);

            // Pick one medium and one easy hint for the initial reveal.
            // Fall back gracefully if a level is unavailable.
            const mediumHint =
                ladder.find(h => h.level === 'medium') ??
                ladder.find(h => h.level === 'hard') ??
                ladder[ladder.length - 1];

            const easyHint =
                ladder.find(h => h.level === 'easy' && h !== mediumHint) ??
                ladder.find(h => h !== mediumHint) ??
                ladder[0];

            const initialHints = [mediumHint, easyHint].filter(
                (h, i, arr) => h !== undefined && arr.indexOf(h) === i
            ) as Hint[];

            const initialSet = new Set(initialHints);
            const furtherHints = ladder.filter(h => !initialSet.has(h));

            return { entity, initialHints, furtherHints };
        });
    }

    /**
     * Returns a single hint for a random entity that has not yet been
     * positioned on the map by the player.
     *
     * Avoids re-surfacing hints that were already shown (either as initial
     * hints or as previously requested further hints).
     *
     * Call this when the player clicks "nova dica!".
     *
     * @param entities          Full GameEntities
     * @param furniture         Full PlacedFurniture array
     * @param rooms             Room metadata
     * @param unplacedEntities  Set of entity names the player hasn't placed yet
     * @param shownHints        Set of hint texts already shown to the player
     */
    static getNextHint(
        entities: GameEntities,
        furniture: PlacedFurniture[],
        rooms: Room[],
        unplacedEntities?: Set<string>,
        shownHints?: Set<string>
    ): Hint | null {
        const candidates: { entity: PlacedEntity; type: 'suspect' | 'weapon' }[] = [
            ...entities.suspects.map(e => ({ entity: e, type: 'suspect' as const })),
            ...entities.weapons.map(e => ({ entity: e, type: 'weapon' as const })),
        ].filter(c =>
            !unplacedEntities || unplacedEntities.has(c.entity.entity.name)
        );

        if (candidates.length === 0) return null;

        // Build the full available (not-yet-shown) hint pool across all candidates.
        const available: Hint[] = [];
        for (const { entity, type } of candidates) {
            const ladder = this.buildLadder(entity, type, entities, furniture, rooms);
            for (const h of ladder) {
                if (!shownHints || !shownHints.has(h.text)) {
                    available.push(h);
                }
            }
        }

        if (available.length === 0) return null;

        // Weight: 40% easy, 40% medium, 20% hard — skew toward useful hints.
        const byLevel: Record<HintLevel, Hint[]> = { easy: [], medium: [], hard: [] };
        for (const h of available) byLevel[h.level].push(h);

        const roll = Random.float();
        let pool: Hint[];
        if (roll < 0.4 && byLevel.easy.length > 0) pool = byLevel.easy;
        else if (roll < 0.8 && byLevel.medium.length > 0) pool = byLevel.medium;
        else if (byLevel.hard.length > 0) pool = byLevel.hard;
        else pool = available;

        return Random.pick(pool);
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

        // FIX: exclude the victim from roommate comparisons so we never
        // directly reveal her location (or the murderer's by association).
        const suspectsOnly = entities.suspects;

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
            .filter(f => adjacent.indexOf(f) === -1);
        if (nearby.length > 0) {
            hints.push(this.hint(name, type, 'easy',
                `${name} está próximo(a) de um(a) ${nearby[0].furniture.name}.`
            ));
        }

        // ── EASY 3: shares room with specific furniture ────────────────────
        const roomFurniture = furniture.filter(f => f.roomId === entity.roomId);
        if (roomFurniture.length > 0) {
            const names = roomFurniture.map(f => f.furniture.name);
            let uniqueNames: string[] = [];
            for (let i = 0; i < names.length; i++)
                if (uniqueNames.indexOf(names[i]) === -1)
                    uniqueNames.push(names[i]);
            uniqueNames = uniqueNames.slice(0, 2);

            hints.push(this.hint(name, type, 'easy',
                `${name} está no mesmo cômodo que um(a) ${uniqueNames.join(' e um(a) ')}.`
            ));
        }

        // ── MEDIUM 1: alone or with which *suspects* ───────────────────────
        // NOTE: the victim is intentionally excluded to avoid leaking her
        // position and, by implication, the murderer's.
        const roommates = suspectsOnly.filter(e =>
            e.roomId === entity.roomId && e.entity.name !== name
        );
        if (roommates.length > 0) {
            const names = roommates.map(r => r.entity.name).join(' e ');
            hints.push(this.hint(name, type, 'medium',
                `${name} não está sozinho(a) — divide o cômodo com ${names}.`
            ));
        } else {
            hints.push(this.hint(name, type, 'medium',
                `${name} está sozinho(a) no cômodo (considerando apenas os suspeitos).`
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
            .filter((_, index) => index !== entity.roomId)
            .map(r => RoomTypeMetaMap[r.roomType].name);
        if (otherRooms.length >= 2) {
            const sample = otherRooms.slice(0, 2);
            hints.push(this.hint(name, type, 'hard',
                `${name} não está ${this.artigo(sample[0])} ${sample[0]} nem ${this.artigo(sample[1])} ${sample[1]}.`
            ));
        }

        // ── HARD 3: global emptiness hint ─────────────────────────────────
        // Use suspects only to avoid revealing victim's room indirectly.
        const occupiedRoomIds = new Set(suspectsOnly.map(e => e.roomId));
        const emptyCount = rooms.filter((_, index) => !occupiedRoomIds.has(index)).length;
        if (emptyCount > 0) {
            hints.push(this.hint(name, type, 'hard',
                `Há ${emptyCount} cômodo(s) na casa sem nenhum suspeito.`
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
            f.roomId === entity.roomId &&
            Math.abs(f.tileX - entity.tileX) <= radius &&
            Math.abs(f.tileY - entity.tileY) <= radius &&
            !(f.tileX === entity.tileX && f.tileY === entity.tileY)
        );
    }

    private static relativeDirection(from: PlacedEntity, to: PlacedFurniture): string {
        const dx = to.tileX - from.tileX;
        const dy = to.tileY - from.tileY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Diagonal: both axes non-zero and within a 2:1 ratio of each other.
        const isDiagonal = absDx > 0 && absDy > 0 && absDx <= absDy * 2 && absDy <= absDx * 2;

        if (isDiagonal) {
            // FIX: in tile/screen coordinates Y increases downward, so dy > 0 → abaixo (below).
            const vDir = dy > 0 ? 'acima' : 'abaixo';
            // FIX: dx > 0 means the furniture is to the right.
            const hDir = dx > 0 ? 'à esquerda' : 'à direita';
            return `na diagonal ${vDir}-${hDir} de`;
        }

        // FIX: primary axis comparison was correct in structure but the
        // vertical labels were swapped. dy > 0 → target is lower on screen → abaixo.
        if (absDx >= absDy) return dx > 0 ? 'à esquerda de' : 'à direita de';
        return dy > 0 ? 'acima de' : 'abaixo de';
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