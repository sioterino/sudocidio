// scenes/game.scene.ts
import { Scene } from 'phaser';
import HighlightManager from '../components/highlight.manager';
import CameraController from '../core/camera.controller';
import TilemapRenderer from '../components/tilemap.renderer';
import PlacementManager from '../core/placement.manager';
import MapGenerator from '../generators/map.generator';
import HintGenerator, { EntityHintSet, Hint } from '../generators/hint.generator';
import HUDComponents from '../ui/HUD.component';
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

        window.addEventListener('sudocidio:requestHint', () => this.giveNewHint());
        // Escuta o botão de Acusação do React
        window.addEventListener('sudocidio:makeAccusation', () => this.evaluateReactAccusation());

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

        this.setupGuessPanel(parent);
    }

    private setupGuessPanel(parent: HTMLElement): void {
        if (this.guessPanel) this.guessPanel.destroy();

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

    // ─── Entity panel (Envia dados pro React) ─────────────────────────────────

    private setupEntityPanel(): void {
        if (this.mapData.entities) {
            const allCharacters = [
                ...this.mapData.entities.suspects.map(p => p.entity),
                this.mapData.entities.victim.entity
            ];
            window.dispatchEvent(new CustomEvent('sudocidio:entitiesGenerated', {
                detail: {
                    suspects: allCharacters,
                    weapons: this.mapData.entities.weapons.map(p => p.entity)
                }
            }));
        }
    }

    // ─── Placement manager (Drag & Drop) ──────────────────────────────────────

    private setupPlacementManager(): void {
        if (this.placementManager) this.placementManager.reset();

        this.placementManager = new PlacementManager(
            this,
            this.mapData,
            () => this.tilemapRenderer.getLayer(),
            (tileX, tileY) => this.tilemapRenderer.getFurnitureAt(tileX, tileY),
            (_placements) => {}
        );

        this.placementManager.setupMapDrag();

        // Avisa o React que tirou a peça (botão direito)
        this.placementManager.setupRemoveOnRightClick((entityName) => {
            window.dispatchEvent(new CustomEvent('sudocidio:pieceRemoved', { detail: { name: entityName } }));
        });

        const canvas = this.sys.game.canvas;
        this.placementManager.attachCanvasDropZone(
            canvas,
            (payload, screenX, screenY) => {
                this.placementManager.handlePanelDrop(payload, screenX, screenY);
                // Avisa o React que soltou a peça no mapa
                window.dispatchEvent(new CustomEvent('sudocidio:piecePlaced', { detail: { name: payload.entityId } }));
            },
            (name) => window.dispatchEvent(new CustomEvent('sudocidio:piecePlaced', { detail: { name } }))
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
        
        // 👉 AVISA O REACT DAS DICAS INICIAIS
        this.hintSets.forEach(hintSet => {
            window.dispatchEvent(new CustomEvent('sudocidio:newHint', {
                detail: {
                    entityName: hintSet.entity.entity.name,
                    entityType: hintSet.entity.type, 
                    text: hintSet.initialHint.text,
                    isInitial: true
                }
            }));
        });

        this.unplacedEntities = new Set<string>();
        this.mapData.entities.suspects.forEach(s => this.unplacedEntities.add(s.entity.name));
        this.mapData.entities.weapons.forEach(w => this.unplacedEntities.add(w.entity.name));
        this.unplacedEntities.add(this.mapData.entities.victim.entity.name);
        
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
            
            // 👉 AVISA O REACT DA NOVA DICA
            window.dispatchEvent(new CustomEvent('sudocidio:newHint', {
                detail: hint
            }));
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

        this.placementManager.reset();
        this.tilemapRenderer.destroy();
        this.renderCurrentMap();

        // 👉 EVITA O CRASH: Envia os novos dados pro React em vez de usar this.entityPanel.populate()
        this.setupEntityPanel();
        
        this.setupPlacementManager();
        this.setupHints();

        if (this.hud.hintsLogContainer) {
            this.hud.hintsLogContainer.innerHTML = '';
        }

        this.hud.updateSeed(this.mapData.seed);
        this.hud.clearRoomInfo();

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

    // ─── React Accusation Evaluation ──────────────────────────────────────────

       // ─── React Accusation Evaluation ──────────────────────────────────────────

    private evaluateReactAccusation(): void {
        if (!this.mapData.entities) return;

        // 1. Confere se o jogador já colocou TODAS as peças no mapa
        if (!this.placementManager.allPlaced(this.mapData.entities)) {
            window.dispatchEvent(new CustomEvent('sudocidio:accusationResult', {
                detail: { success: false, message: 'Você precisa posicionar todas as peças no mapa primeiro!' }
            }));
            return;
        }

        const allPlacements = this.placementManager.getAll();
        const { suspects, weapons, victim } = this.mapData.entities; // Esse é o gabarito original!

        let amountOfErrors = 0;

        // Função auxiliar que checa se a peça está no quadradinho exato do gabarito
        const isPlacementCorrect = (correctEntity: any) => {
            // Acha a peça que o jogador colocou pelo nome
            const placed = allPlacements.find(p => p.entityName === correctEntity.entity.name);
            
            // Se não achou ou se o X e Y não baterem com o gabarito, conta como erro
            if (!placed || placed.tileX !== correctEntity.tileX || placed.tileY !== correctEntity.tileY) {
                amountOfErrors++;
                // Descomente a linha abaixo se quiser ver no Console do navegador quem você errou!
                console.log(`Erro em: ${correctEntity.entity.name} | Certo: (${correctEntity.tileX}, ${correctEntity.tileY}) | Colocado: (${placed?.tileX}, ${placed?.tileY})`);
            }
        };

        // 2. Verifica a posição exata da Vítima
        isPlacementCorrect(victim);

        // 3. Verifica a posição exata de TODOS os Suspeitos
        suspects.forEach(isPlacementCorrect);

        // 4. Verifica a posição exata de TODAS as Armas
        weapons.forEach(isPlacementCorrect);

        // 5. Dá o veredito!
        if (amountOfErrors === 0) {
            this.showVictoryEffect(); // Solta os fogos no mapa do Phaser
            window.dispatchEvent(new CustomEvent('sudocidio:accusationResult', {
                detail: { success: true, message: '🎉 PERFEITO! Você deduziu o local exato de cada pista e resolveu o caso!' }
            }));
        } else {
            window.dispatchEvent(new CustomEvent('sudocidio:accusationResult', {
                detail: { success: false, message: `❌ Errado! Você errou a posição de ${amountOfErrors} peça(s). Reveja as dicas!` }
            }));
        }
    }
    }