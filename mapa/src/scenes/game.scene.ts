// scenes/game.scene.ts
import { Scene } from 'phaser';
import HighlightManager from '../components/highlight.manager';
import CameraController from '../core/camera.controller';
import TilemapRenderer from '../components/tilemap.renderer';
import PlacementManager from '../core/placement.manager';
import MapGenerator from '../generators/map.generator';
import HintGenerator, { EntityHintSet, Hint } from '../generators/hint.generator';
import HUDComponents from '../ui/HUD.component';
import EntityPanel from '../ui/entity.panel';
import GuessPanel, { Accusation } from '../ui/guess.panel';
import Coordinates from '../utils/coordinates.utils';
import DOMHelpers from '../utils/DOM.utils';
import type { MapData } from '../types/interfaces';
import type { PlacedEntity, Suspect, Victim, Weapon } from '../types/npc.registry';
import type { PlacedFurniture } from '../types/furniture.registry';

export class GameScene extends Scene {
    private mapData!: MapData;
    private tilemapRenderer!: TilemapRenderer;
    private highlightManager!: HighlightManager;
    private cameraController!: CameraController;
    private hud!: HUDComponents;
    private entityPanel!: EntityPanel;
    private guessPanel!: GuessPanel;
    private placementManager!: PlacementManager;

    // Hint properties
    private hintSets: EntityHintSet[] = [];
    private unplacedEntities: Set<string> = new Set();

    constructor() {
        super({ key: 'GameScene' });
    }

    create(): void {
        const urlParams = new URLSearchParams(window.location.search);
        const seedFromUrl = urlParams.get('seed');
        this.mapData = MapGenerator.generate(seedFromUrl || undefined);

        this.tilemapRenderer = new TilemapRenderer(this);
        this.cameraController = new CameraController(this, () => this.tilemapRenderer.getLayer());

        this.setupHighlightManager();
        this.renderCurrentMap();
        this.setupHUD();
        this.setupEntityPanel();
        this.setupPlacementManager();
        this.setupHoverInteraction();
        this.setupHints();

        console.log(`Map generated with seed: ${this.mapData.seed}`);
        if (this.mapData.entities) {
            const { murderer, killingWeapon, victim } = this.mapData.entities;
            console.log(`Assassino: ${murderer.name} com ${killingWeapon.name}`);
            console.log(`Vítima: ${(victim.entity as Victim).name}`);
        }
    }

    // ─── Core setup ───────────────────────────────────────────────────────────

    private setupHighlightManager(): void {
        this.highlightManager = new HighlightManager(
            (x, y) => this.mapData.tiles[y][x],
            (x, y, value) => this.tilemapRenderer.updateTile(x, y, value)
        );
    }

    private renderCurrentMap(): void {
        this.tilemapRenderer.render(this.mapData.tiles, this.mapData.width, this.mapData.height);
        this.cameraController.centerMap(this.mapData.width, this.mapData.height);

        if (this.mapData.furniture) {
            this.tilemapRenderer.renderFurniture(this.mapData.furniture);
        }
        // NOTE: we no longer render entities via TilemapRenderer —
        // PlacementManager handles all entity sprites so they are draggable.
    }

    // ─── HUD ──────────────────────────────────────────────────────────────────

    private setupHUD(): void {
        DOMHelpers.removeElementById('game-hud');
        const parent = document.getElementById('game-canvas-wrapper') ?? document.body;
        Object.assign(parent.style, { position: 'relative' });

        this.hud = new HUDComponents(parent, this.mapData.seed);
        this.hud.goButton.onclick = () => this.regenerateMap();
        this.hud.seedInput.onkeydown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') this.regenerateMap();
        };
        this.hud.setOnNewHintRequested(() => this.giveNewHint());

        // Guess panel lives inside the HUD container (below hints)
        // We find it via the hints panel's parent node
        this.setupGuessPanel(parent);
    }

    private setupGuessPanel(parent: HTMLElement): void {
        if (this.guessPanel) this.guessPanel.destroy();

        // Attach to the same wrapper as the HUD; it will be appended last
        this.guessPanel = new GuessPanel(parent);

        this.guessPanel.setOnSubmit((accusation: Accusation) => {
            return this.evaluateAccusation(accusation);
        });

        if (this.mapData.entities) {
            const suspectNames = this.mapData.entities.suspects.map(
                p => (p.entity as Suspect).name
            );
            const weaponNames = this.mapData.entities.weapons.map(
                p => (p.entity as Weapon).name
            );
            this.guessPanel.populate(suspectNames, weaponNames);
        }
    }

    // ─── Entity panel (right sidebar) ─────────────────────────────────────────

    private setupEntityPanel(): void {
        if (this.entityPanel) this.entityPanel.destroy();

        const parent = document.getElementById('game-canvas-wrapper') ?? document.body;
        this.entityPanel = new EntityPanel(parent, (_payload) => {
            // drag start callback — we could add visual feedback here
        });

        if (this.mapData.entities) {
            this.entityPanel.populate(this.mapData.entities);
        }
    }

    // ─── Placement manager ────────────────────────────────────────────────────

    private setupPlacementManager(): void {
        if (this.placementManager) this.placementManager.reset();

        this.placementManager = new PlacementManager(
            this,
            this.mapData,
            () => this.tilemapRenderer.getLayer(),
            (tileX, tileY) => this.tilemapRenderer.getFurnitureAt(tileX, tileY),
            (_placements) => {
                // Called whenever placements change — could update a counter
            }
        );

        // Wire map-dragging
        this.placementManager.setupMapDrag();

        // Right-click to remove
        this.placementManager.setupRemoveOnRightClick((entityName) => {
            this.entityPanel.markUnplaced(entityName);
        });

        // Wire HTML5 drag-drop from the entity panel onto the Phaser canvas
        const canvas = this.sys.game.canvas;
        this.placementManager.attachCanvasDropZone(
            canvas,
            (payload, screenX, screenY) => {
                const placed = this.placementManager.handlePanelDrop(payload, screenX, screenY);
                if (placed) this.entityPanel.markPlaced(payload.entityId);
                return placed;
            }
        );
    }

    // ─── Accusation evaluation ────────────────────────────────────────────────

    private evaluateAccusation(accusation: Accusation): boolean {
        if (!this.mapData.entities) return false;

        const { murderer, killingWeapon } = this.mapData.entities;

        const murdererCorrect = accusation.murdererName === murderer.name;
        const weaponCorrect   = accusation.weaponName   === killingWeapon.name;

        if (murdererCorrect && weaponCorrect) {
            this.showVictoryEffect();
            return true;
        }
        return false;
    }

    private showVictoryEffect(): void {
        const x = this.cameras.main.centerX;
        const y = this.cameras.main.centerY - 80;

        const text = this.add.text(x, y, '🎉 Caso resolvido!', {
            fontSize: '18px',
            color: '#ffd700',
            backgroundColor: '#000000cc',
            padding: { x: 16, y: 10 },
            fontFamily: 'Courier New',
        });
        text.setOrigin(0.5);
        text.setDepth(1000);
        text.setScrollFactor(0);

        this.tweens.add({
            targets: text,
            alpha: 0,
            y: y - 50,
            duration: 4000,
            delay: 1500,
            onComplete: () => text.destroy(),
        });
    }

    // ─── Hints ────────────────────────────────────────────────────────────────

    private setupHints(): void {
        if (!this.mapData.entities || !this.mapData.furniture) return;

        this.hintSets = HintGenerator.getInitialHints(
            this.mapData.entities,
            this.mapData.furniture,
            this.mapData.rooms
        );

        this.unplacedEntities = new Set<string>();
        this.mapData.entities.suspects.forEach(s => this.unplacedEntities.add(s.entity.name));
        this.mapData.entities.weapons.forEach(w => this.unplacedEntities.add(w.entity.name));
        this.unplacedEntities.add(this.mapData.entities.victim.entity.name);

        this.hud.displayInitialHints(this.hintSets);
        this.hud.updateUnplacedCount(this.unplacedEntities.size);
    }

    private giveNewHint(): void {
        if (!this.mapData.entities || !this.mapData.furniture) return;

        if (this.unplacedEntities.size === 0) {
            this.hud.addHintToLog({
                entityName: 'SISTEMA',
                entityType: 'suspect',
                level: 'medium',
                text: '🎉 Todas as entidades foram posicionadas!',
            } as Hint);
            return;
        }

        const hint = HintGenerator.getNextHint(
            this.mapData.entities,
            this.mapData.furniture,
            this.mapData.rooms,
            this.unplacedEntities
        );

        if (hint) {
            this.hud.addHintToLog(hint);
            this.showFloatingHint(hint);
        }
    }

    private showFloatingHint(hint: Hint): void {
        const x = this.cameras.main.centerX;
        const y = this.cameras.main.centerY - 100;

        const text = this.add.text(x, y, `💡 ${hint.entityName}: ${hint.text}`, {
            fontSize: '12px',
            color: '#ffd700',
            backgroundColor: '#000000aa',
            padding: { x: 8, y: 4 },
            fontFamily: 'Courier New',
        });
        text.setOrigin(0.5);
        text.setDepth(1000);
        text.setScrollFactor(0);

        this.tweens.add({
            targets: text,
            alpha: 0,
            y: y - 30,
            duration: 3000,
            onComplete: () => text.destroy(),
        });
    }

    // ─── Hover ────────────────────────────────────────────────────────────────

    private setupHoverInteraction(): void {
        this.input.off('pointermove');
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            // Don't update hover cursor while dragging
            const layer = this.tilemapRenderer.getLayer();
            if (!layer) return;

            const coords = Coordinates.screenToTile(
                pointer.x, pointer.y,
                layer.x, layer.y,
                layer.scaleX
            );

            if (coords && this.isWithinMapBounds(coords.tileX, coords.tileY)) {
                this.handleHover(coords.tileX, coords.tileY);
            } else {
                this.clearHover();
            }
        });
    }

    private handleHover(tileX: number, tileY: number): void {
        const result = this.highlightManager.highlight(tileX, tileY);

        if (result.isHighlightable) {
            this.hud.updateRoom(result.roomName);
            this.hud.updateCoordinates(tileX + 1, tileY + 1);

            // Show placement info instead of the generator entity info
            const placed = this.placementManager.getAtTile(tileX, tileY);
            const furniture = this.tilemapRenderer.getFurnitureAt(tileX, tileY);

            let displayName: string | null = placed
                ? this.getPlacedDisplayName(placed.entityType, placed.entityName)
                : null;

            if (furniture && !displayName) {
                displayName = `móvel: ${furniture.furniture.name}`;
            } else if (furniture && displayName) {
                displayName = `${displayName} (${furniture.furniture.name})`;
            }

            this.hud.updateEntity(displayName);
            this.input.setDefaultCursor(placed ? 'grab' : 'pointer');
        } else {
            this.input.setDefaultCursor('default');
        }
    }

    private getPlacedDisplayName(
        type: 'suspect' | 'victim' | 'weapon',
        name: string
    ): string {
        if (type === 'suspect') return `suspeito: ${name}`;
        if (type === 'victim')  return `vítima: ${name}`;
        return `arma: ${name}`;
    }

    private clearHover(): void {
        this.highlightManager.clear();
        this.hud.clearRoomInfo();
        this.input.setDefaultCursor('default');
    }

    private isWithinMapBounds(tileX: number, tileY: number): boolean {
        return Coordinates.isValidTile(tileX, tileY, this.mapData.width, this.mapData.height);
    }

    // ─── Regenerate ───────────────────────────────────────────────────────────

    private async regenerateMap(): Promise<void> {
        const newSeed = this.hud.getSeedValue();
        this.hud.clearInput();

        this.mapData = MapGenerator.generate(newSeed);

        this.setupHighlightManager();

        // Reset placements (destroys sprites)
        this.placementManager.reset();

        this.tilemapRenderer.destroy();
        this.renderCurrentMap();

        // Repopulate panel
        if (this.mapData.entities) {
            this.entityPanel.populate(this.mapData.entities);
        }

        // Re-wire placement manager with new map data
        this.setupPlacementManager();

        this.setupHints();

        if (this.hud.hintsLogContainer) {
            this.hud.hintsLogContainer.innerHTML = '';
        }

        this.hud.updateSeed(this.mapData.seed);
        this.hud.clearRoomInfo();

        // Repopulate guess panel
        if (this.mapData.entities) {
            const suspectNames = this.mapData.entities.suspects.map(
                p => (p.entity as Suspect).name
            );
            const weaponNames = this.mapData.entities.weapons.map(
                p => (p.entity as Weapon).name
            );
            this.guessPanel.populate(suspectNames, weaponNames);
        }

        console.log(`Map regenerated with seed: ${this.mapData.seed}`);
    }
}