/* eslint-disable @typescript-eslint/no-explicit-any */
// core/placement.manager.ts
import type { Scene } from 'phaser';
import type { GameEntities, PlacedEntity, Suspect, Victim, Weapon } from '../types/npc.registry';
import type { MapData } from '../types/interfaces';
import type { PlacedFurniture } from '../types/furniture.registry';
import { OverlapType } from '../types/furniture.registry';
import type { DragPayload } from '../ui/entity.panel';
import Coordinates from '../utils/coordinates.utils';

export interface MapPlacement {
    entityName: string;
    entityType: 'suspect' | 'victim' | 'weapon';
    tileX: number;
    tileY: number;
    sprite: Phaser.GameObjects.Sprite;
    ghost?: Phaser.GameObjects.Sprite;
}

type OnPlacementChange = (placements: MapPlacement[]) => void;

class PlacementManager {
    private placements: Map<string, MapPlacement> = new Map();
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

    handlePanelDrop(payload: DragPayload, screenX: number, screenY: number): boolean {
        const layer = this.getLayer();
        if (!layer) return false;

        const tile = Coordinates.screenToTile(screenX, screenY, layer.x, layer.y, layer.scaleX);
        if (!tile) return false;

        const entity = this.findEntityByName(payload.entityId, payload.entityType);
        if (!entity) return false;

        if (!this.isValidPlacement(tile.tileX, tile.tileY, payload.entityType)) return false;

        const existing = this.placements.get(`${tile.tileX},${tile.tileY}`);
        if (existing && existing.entityName !== payload.entityId) return false;

        // Remove prior placement of this entity (it might have been on the map already)
        this.removePlacementAtTile(tile.tileX, tile.tileY);
        this.removePlacementByName(payload.entityId);
        this.createPlacement(entity, payload.entityType, tile.tileX, tile.tileY);
        return true;
    }

    // ─── Dragging sprites already on the map ─────────────────────────────────

    setupMapDrag(): void {
        this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const tile = this.pointerToTile(pointer);
            if (!tile) return;

            const key = `${tile.tileX},${tile.tileY}`;
            const placement = this.placements.get(key);
            if (!placement) return;

            this.isDraggingFromMap = true;
            this.dragTarget = placement;

            const ghost = this.scene.add.sprite(pointer.x, pointer.y, placement.sprite.texture.key);
            ghost.setScale(placement.sprite.scaleX);
            ghost.setDepth(200);
            ghost.setAlpha(0.6);
            placement.ghost = ghost;

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

            if (target.ghost) {
                target.ghost.destroy();
                target.ghost = undefined;
            }

            const tile = this.pointerToTile(pointer);

            if (!tile || !this.isValidPlacement(tile.tileX, tile.tileY, target.entityType)) {
                target.sprite.setAlpha(1);
                return;
            }

            const fromKey = `${target.tileX},${target.tileY}`;

            if (tile.tileX === target.tileX && tile.tileY === target.tileY) {
                target.sprite.setAlpha(1);
                return;
            }

            const destExisting = this.placements.get(`${tile.tileX},${tile.tileY}`);
            if (destExisting && destExisting.entityName !== target.entityName) {
                target.sprite.setAlpha(1);
                return;
            }

            // Remove anything already at the destination
            this.removePlacementAtTile(tile.tileX, tile.tileY);

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

    // ─── Helpers públicos de coordenada (usados pelo SHUFFLE animado) ─────────

    /**
     * Converte tile → pixel. Exposto publicamente para que a GameScene
     * possa calcular o destino antes de animar o sprite.
     */
    public tileToPixelPublic(tileX: number, tileY: number): { x: number; y: number } {
        return this.tileToPixel(tileX, tileY);
    }

    /**
     * Atualiza apenas os dados internos (placements/byName) sem mover o sprite.
     * Usado pelo SHUFFLE animado: o tween já cuidou do reposicionamento visual,
     * aqui só sincronizamos o estado de dados.
     */
    public movePlacementDataOnly(entityName: string, destTileX: number, destTileY: number): void {
        const placement = this.byName.get(entityName);
        if (!placement) return;

        const oldKey = `${placement.tileX},${placement.tileY}`;
        const newKey = `${destTileX},${destTileY}`;

        this.placements.delete(oldKey);
        placement.tileX = destTileX;
        placement.tileY = destTileY;
        this.placements.set(newKey, placement);
        this.byName.set(entityName, placement);
        // Não chama onChange aqui — a GameScene chama checkPlacements manualmente
    }

    // ─── Move placement (usado pelo SHUFFLE) ─────────────────────────────────

    /**
     * Move uma peça já posicionada para um novo tile.
     * Atualiza o sprite pixel, os mapas internos e dispara onChange.
     * Não valida overlap/furniture — o SHUFFLE trabalha com posições
     * que já eram válidas antes, então a troca é segura.
     */
    movePlacement(entityName: string, destTileX: number, destTileY: number): void {
        const placement = this.byName.get(entityName);
        if (!placement) return;

        const oldKey = `${placement.tileX},${placement.tileY}`;
        const newKey = `${destTileX},${destTileY}`;

        // Se já há algo no destino, remove primeiro
        const existing = this.placements.get(newKey);
        if (existing && existing.entityName !== entityName) {
            // Não destrói o sprite — será reposicionado pelo próprio loop do SHUFFLE
            this.placements.delete(newKey);
            this.byName.delete(existing.entityName);
        }

        // Remove da posição antiga
        this.placements.delete(oldKey);

        // Atualiza posição tile
        placement.tileX = destTileX;
        placement.tileY = destTileY;

        // Atualiza posição pixel do sprite
        const pixel = this.tileToPixel(destTileX, destTileY);
        placement.sprite.setPosition(pixel.x, pixel.y);

        // Reindexa
        this.placements.set(newKey, placement);
        this.byName.set(entityName, placement);

        this.onChange(this.getAll());
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

    allPlaced(entities: GameEntities): boolean {
        const total = entities.suspects.length + 1 + entities.weapons.length;
        return this.placements.size >= total;
    }

    // ─── Reset ────────────────────────────────────────────────────────────────

    reset(): void {
        Array.from(this.placements.values()).forEach(p => {
            p.ghost?.destroy();
            p.sprite.destroy();
        });
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
        const found = entities.weapons.find(p => (p.entity as Weapon).name === name);
        return found ? (found.entity as Weapon) : null;
    }

    private isValidPlacement(
        tileX: number,
        tileY: number,
        entityType: 'suspect' | 'victim' | 'weapon'
    ): boolean {
        const { tiles, width, height } = this.mapData;
        if (!Coordinates.isValidTile(tileX, tileY, width, height)) return false;
        if (tiles[tileY][tileX] < 2) return false;

        const furniture = this.getFurnitureAt(tileX, tileY);
        if (!furniture) return true;

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

    private pointerToTile(pointer: Phaser.Input.Pointer): { tileX: number; tileY: number } | null {
        const layer = this.getLayer();
        if (!layer) return null;
        return Coordinates.screenToTile(pointer.x, pointer.y, layer.x, layer.y, layer.scaleX);
    }

    private getTrueEntity(name: string): PlacedEntity | null {
        const { entities } = this.mapData;
        if (!entities) return null;

        const all = [...entities.suspects, entities.victim, ...entities.weapons];
        return all.find(e => (e.entity as any).name === name) ?? null;
    }

    public isCorrectPlacement(name: string, tileX: number, tileY: number): boolean {
        const real = this.getTrueEntity(name);
        if (!real) return false;
        return real.tileX === tileX && real.tileY === tileY;
    }

    public batchMovePlacements(moves: { entityName: string; tileX: number; tileY: number }[]): void {
    // Passo 1: remove todas as chaves antigas
    for (const { entityName } of moves) {
        const placement = this.byName.get(entityName);
        if (!placement) continue;
        this.placements.delete(`${placement.tileX},${placement.tileY}`);
    }

    // Passo 2: escreve todas as chaves novas
    for (const { entityName, tileX, tileY } of moves) {
        const placement = this.byName.get(entityName);
        if (!placement) continue;
        placement.tileX = tileX;
        placement.tileY = tileY;
        this.placements.set(`${tileX},${tileY}`, placement);
        this.byName.set(entityName, placement);
    }
}
}

export default PlacementManager;