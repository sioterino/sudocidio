// scenes/game.scene.ts
import { Scene } from 'phaser';
import HighlightManager from '../components/highlight.manager';
import CameraController from '../core/camera.controller';
import TilemapRenderer from '../components/tilemap.renderer';
import PlacementManager, { MapPlacement } from '../core/placement.manager';
import MapGenerator from '../generators/map.generator';
import HintGenerator, { EntityHintSet, Hint } from '../generators/hint.generator';
import HUDComponents from '../ui/HUD.component';
import GuessPanel, { Accusation } from '../ui/guess.panel';
import Coordinates from '../utils/coordinates.utils';
import DOMHelpers from '../utils/DOM.utils';
import type { MapData } from '../types/interfaces';
import type { PlacedEntity, Suspect, Victim, Weapon } from '../types/npc.registry';
import type { PlacedFurniture } from '../types/furniture.registry';

// Declara o global para o TypeScript não reclamar
declare global {
    interface Window {
        __sudocidio_seed?: string;
    }
}

export class GameScene extends Scene {
    private mapData!: MapData;
    private tilemapRenderer!: TilemapRenderer;
    private highlightManager!: HighlightManager;
    private cameraController!: CameraController;
    private hud!: HUDComponents;
    private guessPanel!: GuessPanel;
    private placementManager!: PlacementManager;

    private hintSets: EntityHintSet[] = [];
    private unplacedEntities: Set<string> = new Set();

    constructor() {
        super({ key: 'GameScene' });
    }

    create(): void {
        // ── Seed: prioridade window.__sudocidio_seed (multiplayer) → URL → aleatória ──
        const seedFromReact = window.__sudocidio_seed;
        const seedFromUrl = new URLSearchParams(window.location.search).get('seed');
        const resolvedSeed = seedFromReact || seedFromUrl || undefined;

        this.mapData = MapGenerator.generate(resolvedSeed);

        this.tilemapRenderer = new TilemapRenderer(this);
        this.cameraController = new CameraController(this, () => this.tilemapRenderer.getLayer());

        this.setupHighlightManager();
        this.renderCurrentMap();
        this.setupHUD();
        this.setupEntityPanel();
        this.setupPlacementManager();
        this.setupHoverInteraction();
        this.setupHints();

        window.addEventListener('sudocidio:applySabotage', ((e: Event) => {
            this.applySabotage((e as CustomEvent).detail.sabotageType);
        }) as EventListener);
        window.addEventListener('sudocidio:requestHint', () => this.giveNewHint());
        window.addEventListener('sudocidio:makeAccusation', ((e: Event) => this.evaluateReactAccusation(e as CustomEvent)) as EventListener);
        window.addEventListener('sudocidio:volumeChange', ((e: Event) => {
            const data = (e as CustomEvent).detail;
            this.sound.volume = data.volume;
        }) as EventListener);

        console.log(`[GameScene] Seed usada: ${this.mapData.seed} (fonte: ${seedFromReact ? 'multiplayer' : seedFromUrl ? 'url' : 'aleatória'})`);

        if (this.mapData.entities) {
            const { murderer, killingWeapon, victim } = this.mapData.entities;
            const highlightResult = this.highlightManager.highlight(victim.tileX, victim.tileY);
            const actualRoom = highlightResult.roomName || "Desconhecido";
            console.log(`Assassino: ${murderer.name} com ${killingWeapon.name}`);
            console.log(`Vítima: ${(victim.entity as Victim).name}`);
            console.log(`Comodo: ${actualRoom}`);
        }
    }

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
            const suspectNames = this.mapData.entities.suspects.map(p => (p.entity as Suspect).name);
            const weaponNames = this.mapData.entities.weapons.map(p => (p.entity as Weapon).name);
            this.guessPanel.populate(suspectNames, weaponNames);
        }
    }

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

    private checkPlacements(placements: MapPlacement[]): void {
        if (!this.mapData.entities) return;

        const { suspects, weapons, victim } = this.mapData.entities;
        const allCorrectEntities = [...suspects, ...weapons, victim];

        // Conta quantas estão corretas agora
        let correctCount = 0;

        placements.forEach(p => {
            const correctEntity = allCorrectEntities.find(e => e.entity.name === p.entityName);

            if (correctEntity && p.tileX === correctEntity.tileX && p.tileY === correctEntity.tileY) {
                p.sprite.setTint(0x00ff00);
                correctCount++;
            } else {
                p.sprite.setTint(0xff0000);
            }
        });

        window.dispatchEvent(new CustomEvent('sudocidio:progressUpdate', {
            detail: { correctCount }
        }));
    }
    private setupPlacementManager(): void {
        if (this.placementManager) this.placementManager.reset();

        this.placementManager = new PlacementManager(
            this,
            this.mapData,
            () => this.tilemapRenderer.getLayer(),
            (tileX, tileY) => this.tilemapRenderer.getFurnitureAt(tileX, tileY),
            (placements: MapPlacement[]) => { this.checkPlacements(placements); }
        );

        this.placementManager.setupMapDrag();
        this.placementManager.setupRemoveOnRightClick((entityName) => {
            window.dispatchEvent(new CustomEvent('sudocidio:pieceRemoved', { detail: { name: entityName } }));
        });

        const canvas = this.sys.game.canvas;
        this.placementManager.attachCanvasDropZone(
            canvas,
            (payload, screenX, screenY) => {
                const isSuccess = this.placementManager.handlePanelDrop(payload, screenX, screenY);
                if (isSuccess) {
                    // Busca a posição atual da peça que acabou de ser colocada
                    const placement = this.placementManager.getByName(payload.entityId);

                    if (placement && this.placementManager.isCorrectPlacement(
                        payload.entityId,
                        placement.tileX,
                        placement.tileY
                    )) {
                        // Só conta progresso se estiver no lugar certo
                        window.dispatchEvent(new CustomEvent('sudocidio:piecePlaced', {
                            detail: { name: payload.entityId }
                        }));
                    }
                }
                return isSuccess;
            }
        );
    }

    private evaluateAccusation(accusation: Accusation): boolean {
        if (!this.mapData.entities) return false;
        const { murderer, killingWeapon } = this.mapData.entities;
        const murdererCorrect = accusation.murdererName === murderer.name;
        const weaponCorrect = accusation.weaponName === killingWeapon.name;
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

    private setupHints(): void {
        if (!this.mapData.entities || !this.mapData.furniture) return;

        this.hintSets = HintGenerator.getInitialHints(
            this.mapData.entities,
            this.mapData.furniture,
            this.mapData.rooms
        );

        this.hintSets.forEach(hintSet => {
            const hintText = hintSet.initialHints && hintSet.initialHints.length > 0
                ? hintSet.initialHints[0].text
                : "Sem dica disponível.";

            window.dispatchEvent(new CustomEvent('sudocidio:newHint', {
                detail: {
                    entityName: hintSet.entity.entity.name,
                    entityType: hintSet.entity.type,
                    text: hintText,
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
            window.dispatchEvent(new CustomEvent('sudocidio:newHint', { detail: hint }));
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

    private getPlacedDisplayName(type: 'suspect' | 'victim' | 'weapon', name: string): string {
        if (type === 'suspect') return `suspeito: ${name}`;
        if (type === 'victim') return `vítima: ${name}`;
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

    private async regenerateMap(): Promise<void> {
        const newSeed = this.hud.getSeedValue();
        this.hud.clearInput();

        this.mapData = MapGenerator.generate(newSeed);

        this.setupHighlightManager();
        this.placementManager.reset();
        this.tilemapRenderer.destroy();
        this.renderCurrentMap();
        this.setupEntityPanel();
        this.setupPlacementManager();
        this.setupHints();

        if (this.hud.hintsLogContainer) {
            this.hud.hintsLogContainer.innerHTML = '';
        }

        this.hud.updateSeed(this.mapData.seed);
        this.hud.clearRoomInfo();

        if (this.mapData.entities) {
            const suspectNames = this.mapData.entities.suspects.map(p => (p.entity as Suspect).name);
            const weaponNames = this.mapData.entities.weapons.map(p => (p.entity as Weapon).name);
            this.guessPanel.populate(suspectNames, weaponNames);
        }

        console.log(`Map regenerated with seed: ${this.mapData.seed}`);
    }

    private evaluateReactAccusation(event: CustomEvent): void {
        if (!this.mapData.entities) return;

        const { room, weapon, murderer } = event.detail;
        const cleanStr = (str: string) => (str || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const { victim, murderer: actualMurdererObj, killingWeapon } = this.mapData.entities;
        const actualMurderer = actualMurdererObj.name;
        const actualWeapon = killingWeapon.name;

        const highlightResult = this.highlightManager.highlight(victim.tileX, victim.tileY);
        const actualRoom = highlightResult.roomName || "Desconhecido";

        const isWeaponCorrect = cleanStr(weapon) === cleanStr(actualWeapon);
        const isMurdererCorrect = cleanStr(murderer) === cleanStr(actualMurderer);
        const isRoomCorrect = cleanStr(room) === cleanStr(actualRoom);

        if (isRoomCorrect && isWeaponCorrect && isMurdererCorrect) {
            this.showVictoryEffect();
            window.dispatchEvent(new CustomEvent('sudocidio:accusationResult', {
                detail: { success: true, message: '🎉 PERFEITO! Caso totalmente resolvido!' }
            }));
            return;
        }

        window.dispatchEvent(new CustomEvent('sudocidio:accusationResult', {
            detail: { success: false, message: `❌ Incorreto! Revise sua acusação..` }
        }));
    }
    private applySabotage(type: 'BLIND' | 'SHUFFLE' | 'LOCK'): void {
    switch (type) {
 
        // BLIND — escurece a tela por 5 segundos
        case 'BLIND': {
            const overlay = this.add.rectangle(
                this.cameras.main.centerX,
                this.cameras.main.centerY,
                this.cameras.main.width,
                this.cameras.main.height,
                0x000000,
                0.85
            );
            overlay.setScrollFactor(0);
            overlay.setDepth(500);
 
            const label = this.add.text(
                this.cameras.main.centerX,
                this.cameras.main.centerY,
                '👁 OFUSCADO!',
                {
                    fontSize: '18px',
                    color: '#c94a4a',
                    fontFamily: 'Courier New',
                    backgroundColor: '#00000099',
                    padding: { x: 12, y: 8 },
                }
            );
            label.setOrigin(0.5);
            label.setScrollFactor(0);
            label.setDepth(501);
 
            this.time.delayedCall(5000, () => {
                overlay.destroy();
                label.destroy();
            });
            break;
        }
 
        // SHUFFLE — embaralha as peças já colocadas no mapa
        case 'SHUFFLE': {
            const placements = this.placementManager.getAll();
            if (placements.length < 2) break;
 
            // Coleta as posições atuais
            const positions = placements.map(p => ({ tileX: p.tileX, tileY: p.tileY }));
 
            // Embaralha as posições (Fisher-Yates)
            for (let i = positions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [positions[i], positions[j]] = [positions[j], positions[i]];
            }
 
            // Reseta o placementManager e recoloca as peças nas novas posições
            // usando dispatchEvent para que o React atualize o progresso
            this.placementManager.reset();
            window.dispatchEvent(new CustomEvent('sudocidio:progressUpdate', {
                detail: { correctCount: 0 }
            }));
 
            const label = this.add.text(
                this.cameras.main.centerX,
                this.cameras.main.centerY - 60,
                '🔀 EMBARALHADO!',
                {
                    fontSize: '16px',
                    color: '#d4874d',
                    fontFamily: 'Courier New',
                    backgroundColor: '#00000099',
                    padding: { x: 12, y: 8 },
                }
            );
            label.setOrigin(0.5);
            label.setScrollFactor(0);
            label.setDepth(501);
            this.tweens.add({
                targets: label,
                alpha: 0,
                y: label.y - 40,
                duration: 2500,
                onComplete: () => label.destroy(),
            });
            break;
        }
 
        // LOCK — trava o drag & drop por 5 segundos
        case 'LOCK': {
            // Desativa input do Phaser
            this.input.enabled = false;
 
            const overlay = this.add.rectangle(
                this.cameras.main.centerX,
                this.cameras.main.centerY,
                this.cameras.main.width,
                this.cameras.main.height,
                0x1a0f0a,
                0.5
            );
            overlay.setScrollFactor(0);
            overlay.setDepth(500);
 
            const label = this.add.text(
                this.cameras.main.centerX,
                this.cameras.main.centerY,
                '🔒 TRAVADO! (5s)',
                {
                    fontSize: '18px',
                    color: '#ffd700',
                    fontFamily: 'Courier New',
                    backgroundColor: '#00000099',
                    padding: { x: 12, y: 8 },
                }
            );
            label.setOrigin(0.5);
            label.setScrollFactor(0);
            label.setDepth(501);
 
            // Contador regressivo
            let remaining = 5;
            const tick = this.time.addEvent({
                delay: 1000,
                repeat: 4,
                callback: () => {
                    remaining--;
                    label.setText(`🔒 TRAVADO! (${remaining}s)`);
                },
            });
 
            this.time.delayedCall(5000, () => {
                this.input.enabled = true;
                overlay.destroy();
                label.destroy();
                tick.destroy();
            });
            break;
        }
    }
}
}