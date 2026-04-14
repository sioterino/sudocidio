// scenes/game.scene.ts
import { Scene } from 'phaser';
import HighlightManager from '../components/highlight.manager';
import CameraController from '../core/camera.controller';
import TilemapRenderer from '../components/tilemap.renderer';
import MapGenerator from '../generators/map.generator';
import HintGenerator, { EntityHintSet, Hint } from '../generators/hint.generator';
import HUDComponents from '../ui/HUD.component';
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
    
    // Hint properties
    private hintSets: EntityHintSet[] = [];
    private unplacedEntities: Set<string> = new Set();

    constructor() {
        super({ key: 'GameScene' });
    }

    create(): void {
        // Initialize with seed from URL or random
        const urlParams = new URLSearchParams(window.location.search);
        const seedFromUrl = urlParams.get('seed');
        this.mapData = MapGenerator.generate(seedFromUrl || undefined);
        
        // Setup core systems
        this.tilemapRenderer = new TilemapRenderer(this);
        this.cameraController = new CameraController(this, () => this.tilemapRenderer.getLayer());
        
        // Setup highlight manager with tile accessors
        this.setupHighlightManager();
        
        // Render initial map
        this.renderCurrentMap();
        
        // Setup UI and interactions
        this.setupHUD();
        this.setupHoverInteraction();
        
        // Setup hints system
        this.setupHints();
        
        console.log(`Map generated with seed: ${this.mapData.seed}`);
        
        // Log entity information for debugging
        if (this.mapData.entities) {
            const { murderer, killingWeapon, victim } = this.mapData.entities;
            console.log(`Assassino: ${murderer.name} com ${killingWeapon.name}`);
            console.log(`Vítima: ${(victim.entity as any).name}`);
        }
        
        // Log furniture information for debugging
        if (this.mapData.furniture) {
            console.log(`Móveis colocados: ${this.mapData.furniture.length}`);
        }
    }

    /**
     * Initializes or re-initializes the highlight manager with current map data.
     */
    private setupHighlightManager(): void {
        this.highlightManager = new HighlightManager(
            (x, y) => this.mapData.tiles[y][x],
            (x, y, value) => this.tilemapRenderer.updateTile(x, y, value)
        );
    }

    /**
     * Renders the current map data.
     */
    private renderCurrentMap(): void {
        this.tilemapRenderer.render(this.mapData.tiles, this.mapData.width, this.mapData.height);
        
        // Center the map first (applies scale and position to the layer)
        this.cameraController.centerMap(this.mapData.width, this.mapData.height);
        
        // Render furniture AFTER centerMap (below entities)
        if (this.mapData.furniture) {
            this.tilemapRenderer.renderFurniture(this.mapData.furniture);
        }
        
        // Render entities AFTER centerMap so we have correct layer position/scale
        if (this.mapData.entities) {
            this.tilemapRenderer.renderEntities(this.mapData.entities);
        }
    }

    /**
     * Creates the HUD overlay.
     */
    private setupHUD(): void {
        DOMHelpers.removeElementById('game-hud');
        const parent = document.getElementById('game-canvas-wrapper') ?? document.body;
        Object.assign(parent.style, { position: 'relative' });
        
        this.hud = new HUDComponents(parent, this.mapData.seed);
        
        // Setup regeneration callback
        this.hud.goButton.onclick = () => this.regenerateMap();
        this.hud.seedInput.onkeydown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') this.regenerateMap();
        };
        
        // Setup hint callback
        this.hud.setOnNewHintRequested(() => this.giveNewHint());
    }
    
    /**
     * Sets up the hints system.
     */
    private setupHints(): void {
        if (!this.mapData.entities || !this.mapData.furniture) return;
        
        // Generate hints for suspects
        this.hintSets = HintGenerator.getInitialHints(
            this.mapData.entities,
            this.mapData.furniture,
            this.mapData.rooms
        );
        
        // Initialize unplaced entities (all entities start as unplaced)
        this.mapData.entities.suspects.forEach(suspect => {
            this.unplacedEntities.add(suspect.entity.name);
        });
        this.mapData.entities.weapons.forEach(weapon => {
            this.unplacedEntities.add(weapon.entity.name);
        });
        this.unplacedEntities.add(this.mapData.entities.victim.entity.name);
        
        // Display initial hints in HUD
        this.hud.displayInitialHints(this.hintSets);
        this.hud.updateUnplacedCount(this.unplacedEntities.size);
    }
    
    /**
     * Gives a new hint to the player.
     */
    private giveNewHint(): void {
        if (!this.mapData.entities || !this.mapData.furniture) return;
        
        if (this.unplacedEntities.size === 0) {
            this.hud.addHintToLog({
                entityName: 'SISTEMA',
                entityType: 'suspect',
                level: 'medium',
                text: '🎉 Parabéns! Todas as entidades foram posicionadas!'
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
    
    /**
     * Shows a floating hint notification on screen.
     */
    private showFloatingHint(hint: Hint): void {
        const x = this.cameras.main.centerX;
        const y = this.cameras.main.centerY - 100;
        
        const text = this.add.text(x, y, `💡 ${hint.entityName}: ${hint.text}`, {
            fontSize: '12px',
            color: '#ffd700',
            backgroundColor: '#000000aa',
            padding: { x: 8, y: 4 },
            fontFamily: 'Courier New'
        });
        text.setOrigin(0.5);
        text.setDepth(1000);
        text.setScrollFactor(0);
        
        this.tweens.add({
            targets: text,
            alpha: 0,
            y: y - 30,
            duration: 3000,
            onComplete: () => text.destroy()
        });
    }

    /**
     * Sets up mouse hover interactions.
     */
    private setupHoverInteraction(): void {
        this.input.off('pointermove');
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
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

    /**
     * Handles tile hover logic.
     */
    private handleHover(tileX: number, tileY: number): void {
        const result = this.highlightManager.highlight(tileX, tileY);
        
        if (result.isHighlightable) {
            this.hud.updateRoom(result.roomName);
            this.hud.updateCoordinates(tileX + 1, tileY + 1);
            
            // Check for entity at this tile
            const entity = this.tilemapRenderer.getEntityAt(tileX, tileY);
            
            // Check for furniture at this tile
            const furniture = this.tilemapRenderer.getFurnitureAt(tileX, tileY);
            
            // Combine entity and furniture display
            let displayName = this.getEntityDisplayName(entity);
            if (furniture && !displayName) {
                displayName = `móvel: ${furniture.furniture.name}`;
            } else if (furniture && displayName) {
                displayName = `${displayName} (${furniture.furniture.name})`;
            }
            
            this.hud.updateEntity(displayName);
            
            this.input.setDefaultCursor('pointer');
        } else {
            this.input.setDefaultCursor('default');
        }
    }

    /**
     * Gets the display name for an entity.
     */
    private getEntityDisplayName(placed: PlacedEntity | null): string | null {
        if (!placed) return null;
        
        const entity = placed.entity;
        
        if (placed.type === 'suspect') {
            return `suspeito: ${(entity as Suspect).name}`;
        } else if (placed.type === 'victim') {
            return `vítima: ${(entity as Victim).name}`;
        } else {
            return `arma: ${(entity as Weapon).name}`;
        }
    }

    /**
     * Clears current hover state.
     */
    private clearHover(): void {
        this.highlightManager.clear();
        this.hud.clearRoomInfo();
        this.input.setDefaultCursor('default');
    }

    /**
     * Regenerates the map with a new seed.
     */
    private async regenerateMap() {
        const newSeed = this.hud.getSeedValue();
        this.hud.clearInput();
        
        // Generate new map data
        this.mapData = MapGenerator.generate(newSeed);
        
        // Re-initialize highlight manager with new map data
        this.setupHighlightManager();
        
        // Clean up old renderer and render new map
        this.tilemapRenderer.destroy();
        this.renderCurrentMap();
        
        // Regenerate hints
        this.setupHints();
        
        // Clear hint log
        if (this.hud.hintsLogContainer) {
            this.hud.hintsLogContainer.innerHTML = '';
        }
        
        // Update HUD
        this.hud.updateSeed(this.mapData.seed);
        this.hud.clearRoomInfo();
        
        console.log(`Map regenerated with seed: ${this.mapData.seed}`);
    }

    /**
     * Checks if tile coordinates are within map bounds.
     */
    private isWithinMapBounds(tileX: number, tileY: number): boolean {
        return Coordinates.isValidTile(tileX, tileY, this.mapData.width, this.mapData.height);
    }
}