// core/placement.manager.ts
import type { Scene } from 'phaser';
import type { GameEntities, PlacedEntity, Suspect, Victim, Weapon } from '../types/npc.registry';
import type { MapData } from '../types/interfaces';
import type { PlacedFurniture } from '../types/furniture.registry';
import { OverlapType } from '../types/furniture.registry';
import type { DragPayload } from '../ui/entity.panel';
import Coordinates from '../utils/coordinates.utils';

/**
 * Minimal info we keep for each entity that has been placed on the map.
 */
export interface MapPlacement {
    entityName: string;
    entityType: 'suspect' | 'victim' | 'weapon';
    tileX: number;
    tileY: number;
    sprite: Phaser.GameObjects.Sprite;
    /** ghost drag sprite, exists only while dragging */
    ghost?: Phaser.GameObjects.Sprite;
}

type OnPlacementChange = (placements: MapPlacement[]) => void;

/**
 * Manages the placement of entities onto the Phaser tilemap.
 *
 * Responsibilities:
 *  - Receive drops from the HTML entity panel  (panel → map)
 *  - Allow dragging sprites already on the map (map → map)
 *  - Remove sprites dragged off the map        (map → panel)
 *  - Expose the current placements so the game scene can evaluate guesses
 */
class PlacementManager {
    /** tileKey "x,y" → placement */
    private placements: Map<string, MapPlacement> = new Map();

    /** nameKey → placement (to find a placed entity by name) */
    private byName: Map<string, MapPlacement> = new Map();

    private dragTarget: MapPlacement | null = null;
    private isDraggingFromMap = false;

    constructor(
        private scene: Scene,
        private mapData: MapData,
        private getLayer: () => Phaser.Tilemaps.TilemapLayer | null,
        private getFurnitureAt: (tileX: number, tileY: number) => PlacedFurniture | null,
        private onChange: OnPlacementChange
    ) {}

    // ─── Drop from HTML panel ────────────────────────────────────────────────

    /**
     * Call this when a dragged card from the entity panel is dropped on the
     * Phaser canvas.  `screenX/Y` are the raw pointer coords over the canvas.
     */
    handlePanelDrop(payload: DragPayload, screenX: number, screenY: number): boolean {
        const layer = this.getLayer();
        if (!layer) return false;

        const tile = Coordinates.screenToTile(screenX, screenY, layer.x, layer.y, layer.scaleX);
        if (!tile) return false;

        // Find the entity object first so we know its type for the overlap check
        const entity = this.findEntityByName(payload.entityId, payload.entityType);
        if (!entity) return false;

        if (!this.isValidPlacement(tile.tileX, tile.tileY, payload.entityType)) return false;

        // Remove any existing placement at that tile
        this.removePlacementAtTile(tile.tileX, tile.tileY);

        // Remove prior placement of this entity (it might have been on the map already)
        this.removePlacementByName(payload.entityId);

        this.createPlacement(entity, payload.entityType, tile.tileX, tile.tileY);
        return true;
    }

    // ─── Dragging sprites already on the map ─────────────────────────────────

    /** Sets up Phaser pointer listeners for dragging existing map sprites. */
    setupMapDrag(): void {
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const tile = this.pointerToTile(pointer);
            if (!tile) return;

            const key = `${tile.tileX},${tile.tileY}`;
            const placement = this.placements.get(key);
            if (!placement) return;

            this.isDraggingFromMap = true;
            this.dragTarget = placement;

            // Create a translucent ghost sprite that follows the pointer
            const ghost = this.scene.add.sprite(pointer.x, pointer.y, placement.sprite.texture.key);
            ghost.setScale(placement.sprite.scaleX);
            ghost.setDepth(200);
            ghost.setAlpha(0.6);
            placement.ghost = ghost;

            // Dim the original
            placement.sprite.setAlpha(0.3);
        });

        this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.isDraggingFromMap || !this.dragTarget?.ghost) return;
            this.dragTarget.ghost.setPosition(pointer.x, pointer.y);
        });

        this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (!this.isDraggingFromMap || !this.dragTarget) return;

            const target = this.dragTarget;
            this.isDraggingFromMap = false;
            this.dragTarget = null;

            // Destroy ghost
            if (target.ghost) {
                target.ghost.destroy();
                target.ghost = undefined;
            }

            const tile = this.pointerToTile(pointer);

            // Dropped outside map, on a wall, or on incompatible furniture → snap back
            if (!tile || !this.isValidPlacement(tile.tileX, tile.tileY, target.entityType)) {
                target.sprite.setAlpha(1);
                return;
            }

            const fromKey = `${target.tileX},${target.tileY}`;

            // Dropped on same tile — no-op
            if (tile.tileX === target.tileX && tile.tileY === target.tileY) {
                target.sprite.setAlpha(1);
                return;
            }

            // Remove anything already at the destination
            this.removePlacementAtTile(tile.tileX, tile.tileY);

            // Move
            this.placements.delete(fromKey);

            target.tileX = tile.tileX;
            target.tileY = tile.tileY;

            const newPos = this.tileToPixel(tile.tileX, tile.tileY);
            target.sprite.setPosition(newPos.x, newPos.y);
            target.sprite.setAlpha(1);

            this.placements.set(`${tile.tileX},${tile.tileY}`, target);
            this.byName.set(target.entityName, target);

            this.onChange(this.getAll());
        });
    }

    // ─── Remove from map (right-click) ───────────────────────────────────────

    /**
     * Sets up a right-click listener to remove a placed entity and return it
     * to the panel.  Returns the entity name so the caller can show its card
     * again.
     */
    setupRemoveOnRightClick(onRemove: (entityName: string) => void): void {
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.rightButtonDown()) {
                const tile = this.pointerToTile(pointer);
                if (!tile) return;
                const key = `${tile.tileX},${tile.tileY}`;
                const placement = this.placements.get(key);
                if (!placement) return;

                this.removePlacementByName(placement.entityName);
                onRemove(placement.entityName);
            }
        });
    }

    // ─── Overlay drop-zone on the canvas ─────────────────────────────────────

    /**
     * Attaches `dragover` / `drop` listeners to the Phaser canvas element so
     * HTML5 drag-and-drop from the entity panel works correctly.
     */
    attachCanvasDropZone(
        canvas: HTMLCanvasElement,
        onDrop: (payload: DragPayload, screenX: number, screenY: number) => boolean
    ): void {
        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer!.dropEffect = 'move';
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const raw = e.dataTransfer?.getData('text/plain');
            if (!raw) return;

            try {
                const payload = JSON.parse(raw) as DragPayload;

                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                const screenX = (e.clientX - rect.left) * scaleX;
                const screenY = (e.clientY - rect.top) * scaleY;

                onDrop(payload, screenX, screenY);
            } catch {
                // ignore malformed data
            }
        });
    }

    // ─── Querying placements ──────────────────────────────────────────────────

    getAll(): MapPlacement[] {
        return Array.from(this.placements.values());
    }

    getAtTile(tileX: number, tileY: number): MapPlacement | null {
        return this.placements.get(`${tileX},${tileY}`) ?? null;
    }

    getByName(name: string): MapPlacement | null {
        return this.byName.get(name) ?? null;
    }

    /** Returns true if every entity (suspects + victim + weapons) is placed. */
    allPlaced(entities: GameEntities): boolean {
        const total =
            entities.suspects.length +
            1 + // victim
            entities.weapons.length;
        return this.placements.size >= total;
    }

    // ─── Reset ────────────────────────────────────────────────────────────────

    reset(): void {
        const placementsArray = Array.from(this.placements.values());

        for (let i = 0; i < placementsArray.length; i++) {
            const p = placementsArray[i];
            p.ghost?.destroy();
            p.sprite.destroy();
        }

        this.placements.clear();
        this.byName.clear();
        this.dragTarget = null;
        this.isDraggingFromMap = false;
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    private createPlacement(
        entity: Suspect | Victim | Weapon,
        entityType: 'suspect' | 'victim' | 'weapon',
        tileX: number,
        tileY: number
    ): void {
        const layer = this.getLayer()!;
        const tileSize = 16;
        const scale = layer.scaleX;

        const pixelX = layer.x + (tileX * tileSize * scale) + (tileSize * scale / 2);
        const pixelY = layer.y + (tileY * tileSize * scale) + (tileSize * scale / 2);

        const textureKey = (entity as any).textureKey as string;
        const sprite = this.scene.add.sprite(pixelX, pixelY, textureKey);

        const spriteScale = Math.min(tileSize / sprite.width, tileSize / sprite.height) * scale;
        sprite.setScale(spriteScale);
        sprite.setDepth(50);

        const name = (entity as any).name as string;

        const placement: MapPlacement = {
            entityName: name,
            entityType,
            tileX,
            tileY,
            sprite,
        };

        this.placements.set(`${tileX},${tileY}`, placement);
        this.byName.set(name, placement);

        this.onChange(this.getAll());
    }

    private removePlacementAtTile(tileX: number, tileY: number): void {
        const key = `${tileX},${tileY}`;
        const existing = this.placements.get(key);
        if (!existing) return;
        existing.ghost?.destroy();
        existing.sprite.destroy();
        this.placements.delete(key);
        this.byName.delete(existing.entityName);
    }

    private removePlacementByName(name: string): void {
        const existing = this.byName.get(name);
        if (!existing) return;
        existing.ghost?.destroy();
        existing.sprite.destroy();
        this.placements.delete(`${existing.tileX},${existing.tileY}`);
        this.byName.delete(name);
    }

    private findEntityByName(
        name: string,
        entityType: 'suspect' | 'victim' | 'weapon'
    ): Suspect | Victim | Weapon | null {
        const { entities } = this.mapData;
        if (!entities) return null;

        if (entityType === 'suspect') {
            const found = entities.suspects.find(p => (p.entity as Suspect).name === name);
            return found ? (found.entity as Suspect) : null;
        }
        if (entityType === 'victim') {
            return (entities.victim.entity as Victim).name === name
                ? (entities.victim.entity as Victim)
                : null;
        }
        // weapon
        const found = entities.weapons.find(p => (p.entity as Weapon).name === name);
        return found ? (found.entity as Weapon) : null;
    }

    /**
     * Returns true when an entity of the given type may be placed on this tile.
     *
     * Rules (in order):
     *  1. Must be within map bounds and be a floor tile (value >= 2).
     *  2. If no furniture occupies the tile -> always allowed.
     *  3. If furniture is present, check its OverlapType:
     *       NONE        -> blocked for everyone
     *       NPC_ONLY    -> allowed only for suspects / victims
     *       WEAPON_ONLY -> allowed only for weapons
     *       BOTH        -> allowed for everyone
     */
    private isValidPlacement(
        tileX: number,
        tileY: number,
        entityType: 'suspect' | 'victim' | 'weapon'
    ): boolean {
        const { tiles, width, height } = this.mapData;
        if (!Coordinates.isValidTile(tileX, tileY, width, height)) return false;

        // Tile 0 = wall, 1 = void - both impassable
        if (tiles[tileY][tileX] < 2) return false;

        const furniture = this.getFurnitureAt(tileX, tileY);
        if (!furniture) return true; // bare floor - always valid

        const { overlap } = furniture.furniture;
        const isNpc = entityType === 'suspect' || entityType === 'victim';

        switch (overlap) {
            case OverlapType.NONE:        return false;
            case OverlapType.NPC_ONLY:    return isNpc;
            case OverlapType.WEAPON_ONLY: return entityType === 'weapon';
            case OverlapType.BOTH:        return true;
            default:                      return false;
        }
    }

    private tileToPixel(tileX: number, tileY: number): { x: number; y: number } {
        const layer = this.getLayer()!;
        const tileSize = 16;
        const scale = layer.scaleX;
        return {
            x: layer.x + (tileX * tileSize * scale) + (tileSize * scale / 2),
            y: layer.y + (tileY * tileSize * scale) + (tileSize * scale / 2),
        };
    }

    private pointerToTile(
        pointer: Phaser.Input.Pointer
    ): { tileX: number; tileY: number } | null {
        const layer = this.getLayer();
        if (!layer) return null;
        return Coordinates.screenToTile(pointer.x, pointer.y, layer.x, layer.y, layer.scaleX);
    }

    // VERIFY IF ENTITY WAS PLACED IN THE CORRECT TILE =============================================

    private getTrueEntity(name: string): PlacedEntity | null {
        const { entities } = this.mapData;
        if (!entities) return null;

        const all = [
            ...entities.suspects,
            entities.victim,
            ...entities.weapons
        ];

        return all.find(e => (e.entity as any).name === name) ?? null;
    }

    public isCorrectPlacement(name: string, tileX: number, tileY: number): boolean {
        const real = this.getTrueEntity(name);
        if (!real) return false;

        return real.tileX === tileX && real.tileY === tileY;
    }

}

export default PlacementManager;