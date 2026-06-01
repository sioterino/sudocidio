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
    private sabotageListener!: EventListener;
    private hintListener!: EventListener;
    private accusationListener!: EventListener;
    private volumeListener!: EventListener;


    // Flag de lock — bloqueia drops HTML5 vindos do React também
    private boardLocked = false;

    constructor() {
        super({ key: 'GameScene' });
    }

    create(): void {
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

        // ── Listeners do window — guardados para remoção no destroy ──────────
        this.sabotageListener = ((e: Event) => {
            this.applySabotage((e as CustomEvent).detail.sabotageType);
        }) as EventListener;

        this.hintListener = (() => this.giveNewHint()) as EventListener;

        this.accusationListener = ((e: Event) => {
            this.evaluateReactAccusation(e as CustomEvent);
        }) as EventListener;

        this.volumeListener = ((e: Event) => {
            this.sound.volume = (e as CustomEvent).detail.volume;
        }) as EventListener;

        window.addEventListener('sudocidio:applySabotage', this.sabotageListener);
        window.addEventListener('sudocidio:requestHint', this.hintListener);
        window.addEventListener('sudocidio:makeAccusation', this.accusationListener);
        window.addEventListener('sudocidio:volumeChange', this.volumeListener);

        this.events.on('destroy', () => {
            window.removeEventListener('sudocidio:applySabotage', this.sabotageListener);
            window.removeEventListener('sudocidio:requestHint', this.hintListener);
            window.removeEventListener('sudocidio:makeAccusation', this.accusationListener);
            window.removeEventListener('sudocidio:volumeChange', this.volumeListener);
        });
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
        this.guessPanel.setOnSubmit((accusation: Accusation) => this.evaluateAccusation(accusation));

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
            // Bloqueia remoção durante lock
            if (this.boardLocked) return;
            window.dispatchEvent(new CustomEvent('sudocidio:pieceRemoved', { detail: { name: entityName } }));
        });

        const canvas = this.sys.game.canvas;
        this.placementManager.attachCanvasDropZone(
            canvas,
            (payload, screenX, screenY) => {
                // Bloqueia qualquer drop durante lock
                if (this.boardLocked) return false;

                const isSuccess = this.placementManager.handlePanelDrop(payload, screenX, screenY);
                if (isSuccess) {
                    const placement = this.placementManager.getByName(payload.entityId);
                    if (placement && this.placementManager.isCorrectPlacement(
                        payload.entityId,
                        placement.tileX,
                        placement.tileY
                    )) {
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
        const text = this.add.text(x, y, 'CASO RESOLVIDO', {
            fontSize: '18px',
            color: '#ffd700',
            backgroundColor: '#000000cc',
            padding: { x: 16, y: 10 },
            fontFamily: '"Courier New", monospace',
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

        console.log(this.hintSets)
        
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
                text: 'Todas as entidades foram posicionadas!',
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
        const text = this.add.text(x, y, `${hint.entityName}: ${hint.text}`, {
            fontSize: '12px',
            color: '#ffd700',
            backgroundColor: '#000000cc',
            padding: { x: 8, y: 4 },
            fontFamily: '"Courier New", monospace',
        });
        text.setOrigin(0.5);
        text.setDepth(1000);
        text.setScrollFactor(0);
        text.setAlpha(0);
        this.tweens.add({ targets: text, alpha: 1, duration: 200 });
        this.tweens.add({
            targets: text,
            alpha: 0,
            y: y - 30,
            duration: 500,
            delay: 2500,
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
                detail: { success: true, message: 'PERFEITO! Caso totalmente resolvido!' }
            }));
            return;
        }

        window.dispatchEvent(new CustomEvent('sudocidio:accusationResult', {
            detail: { success: false, message: 'Incorreto! Revise sua acusação.' }
        }));
    }

    // ─── Sabotagens ───────────────────────────────────────────────────────────

    private applySabotage(type: 'BLIND' | 'SHUFFLE' | 'LOCK'): void {
        switch (type) {

            // ── BLIND — overlay quase opaco, praticamente sem ver nada ────────
            case 'BLIND': {
                // Alpha 0.97: tela quase preta, apenas traços visíveis
                const overlay = this.add.rectangle(
                    this.cameras.main.centerX,
                    this.cameras.main.centerY,
                    this.cameras.main.width,
                    this.cameras.main.height,
                    0x000000
                );
                overlay.setScrollFactor(0).setDepth(500).setAlpha(0);
                this.tweens.add({ targets: overlay, alpha: 0.97, duration: 300, ease: 'Quad.Out' });

                // Label limpo sem emoji
                const label = this.add.text(
                    this.cameras.main.centerX,
                    this.cameras.main.centerY,
                    'OFUSCADO',
                    {
                        fontSize: '13px',
                        color: '#c94a4a',
                        fontFamily: '"Courier New", monospace',
                        fontStyle: 'bold',
                        letterSpacing: 6,
                    }
                );
                label.setOrigin(0.5).setScrollFactor(0).setDepth(501).setAlpha(0);
                this.tweens.add({ targets: label, alpha: 1, duration: 300, delay: 150 });

                // Barra de progresso fina
                const barTrack = this.add.rectangle(
                    this.cameras.main.centerX,
                    this.cameras.main.centerY + 24,
                    120, 2,
                    0x330000
                );
                barTrack.setScrollFactor(0).setDepth(502).setAlpha(0);
                this.tweens.add({ targets: barTrack, alpha: 0.6, duration: 300, delay: 150 });

                const bar = this.add.rectangle(
                    this.cameras.main.centerX - 60,
                    this.cameras.main.centerY + 24,
                    0, 2,
                    0xc94a4a
                );
                bar.setOrigin(0, 0.5).setScrollFactor(0).setDepth(503).setAlpha(0);
                this.tweens.add({ targets: bar, alpha: 1, duration: 300, delay: 150 });
                this.tweens.add({ targets: bar, width: 120, duration: 10000, ease: 'Linear', delay: 150 });

                // Fade out suave no fim dos 5s
                this.time.delayedCall(10000, () => {
                    this.tweens.add({
                        targets: [overlay, label, barTrack, bar],
                        alpha: 0,
                        duration: 400,
                        ease: 'Quad.In',
                        onComplete: () => {
                            overlay.destroy();
                            label.destroy();
                            barTrack.destroy();
                            bar.destroy();
                        },
                    });
                });
                break;
            }

            // ── SHUFFLE — sprites voam animados até as novas posições ──────────
            case 'SHUFFLE': {
                const placements = this.placementManager.getAll();
                console.log('SHUFFLE - placements:', placements.length, placements.map(p => `${p.entityName}@${p.tileX},${p.tileY}`));
                const valid = placements.filter(p => this.isWithinMapBounds(p.tileX, p.tileY));
                console.log('SHUFFLE - valid:', valid.length);
                if (valid.length < 2) { console.log('SHUFFLE - abortou, válidos < 2'); break; }

                const positions = valid.map(p => ({ tileX: p.tileX, tileY: p.tileY }));
                for (let i = positions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [positions[i], positions[j]] = [positions[j], positions[i]];
                }

                const ANIM_DURATION = 420;
                let settled = 0;

                valid.forEach((placement, i) => {
                    const dest = positions[i];
                    const destPixel = this.placementManager.tileToPixelPublic(dest.tileX, dest.tileY);

                    if (dest.tileX === placement.tileX && dest.tileY === placement.tileY) {
                        settled++;
                        return;
                    }

                    const midX = (placement.sprite.x + destPixel.x) / 2;
                    const midY = Math.min(placement.sprite.y, destPixel.y) - 18;

                    this.tweens.add({
                        targets: placement.sprite,
                        x: midX, y: midY,
                        scaleX: placement.sprite.scaleX * 1.25,
                        scaleY: placement.sprite.scaleY * 1.25,
                        alpha: 0.75, depth: 150,
                        duration: ANIM_DURATION * 0.45,
                        ease: 'Quad.Out',
                        onComplete: () => {
                            this.tweens.add({
                                targets: placement.sprite,
                                x: destPixel.x, y: destPixel.y,
                                scaleX: placement.sprite.scaleX / 1.25,
                                scaleY: placement.sprite.scaleY / 1.25,
                                alpha: 1, depth: 50,
                                duration: ANIM_DURATION * 0.55,
                                ease: 'Bounce.Out',
                                onComplete: () => {
                                    settled++;
                                    if (settled === valid.length) {
                                        // ✅ Batch atômico: primeiro limpa TUDO, depois reescreve TUDO
                                        this.placementManager.batchMovePlacements(
                                            valid.map((p, idx) => ({
                                                entityName: p.entityName,
                                                tileX: positions[idx].tileX,
                                                tileY: positions[idx].tileY,
                                            }))
                                        );
                                        this.checkPlacements(this.placementManager.getAll());
                                    }
                                },
                            });
                        },
                    });
                });

                const label = this.add.text(
                    this.cameras.main.centerX,
                    this.cameras.main.centerY - 55,
                    'SWAP',
                    { fontSize: '11px', color: '#d4874d', fontFamily: '"Courier New", monospace', fontStyle: 'bold', letterSpacing: 8 }
                );
                label.setOrigin(0.5).setScrollFactor(0).setDepth(501).setAlpha(0);
                this.tweens.add({ targets: label, alpha: 1, duration: 120 });
                this.tweens.add({
                    targets: label, alpha: 0, y: label.y - 20,
                    duration: 400, delay: ANIM_DURATION + 100,
                    onComplete: () => label.destroy(),
                });
                break;
            }

            // ── LOCK — bloqueia Phaser + drops do React por 5s ────────────────
            case 'LOCK': {
                // 1) Bloqueia drag interno do Phaser
                this.input.enabled = false;
                // 2) Bloqueia handlePanelDrop e clique direito
                this.boardLocked = true;
                // 3) Avisa o React para desabilitar drag do PiecesPanel
                window.dispatchEvent(new CustomEvent('sudocidio:boardLocked', { detail: { locked: true } }));

                // Overlay escuro roxo-escuro
                const overlay = this.add.rectangle(
                    this.cameras.main.centerX,
                    this.cameras.main.centerY,
                    this.cameras.main.width,
                    this.cameras.main.height,
                    0x0a0514
                );
                overlay.setScrollFactor(0).setDepth(500).setAlpha(0);
                this.tweens.add({ targets: overlay, alpha: 0.55, duration: 250, ease: 'Quad.Out' });

                // Label sem emoji
                const label = this.add.text(
                    this.cameras.main.centerX,
                    this.cameras.main.centerY,
                    'TRAVADO  10s',
                    {
                        fontSize: '13px',
                        color: '#a89fd4',
                        fontFamily: '"Courier New", monospace',
                        fontStyle: 'bold',
                        letterSpacing: 6,
                    }
                );
                label.setOrigin(0.5).setScrollFactor(0).setDepth(501).setAlpha(0);
                this.tweens.add({ targets: label, alpha: 1, duration: 250, delay: 100 });

                // Barra que encolhe (tempo restante)
                const barTrack = this.add.rectangle(
                    this.cameras.main.centerX,
                    this.cameras.main.centerY + 24,
                    120, 2,
                    0x1a0f30
                );
                barTrack.setScrollFactor(0).setDepth(502).setAlpha(0.5);

                const bar = this.add.rectangle(
                    this.cameras.main.centerX - 60,
                    this.cameras.main.centerY + 24,
                    120, 2,
                    0xa89fd4
                );
                bar.setOrigin(0, 0.5).setScrollFactor(0).setDepth(503);
                this.tweens.add({ targets: bar, width: 0, duration: 10000, ease: 'Linear' });

                // Contador regressivo
                let remaining = 10;
                const tick = this.time.addEvent({
                    delay: 1000,
                    repeat: 9,
                    callback: () => {
                        remaining--;
                        label.setText(remaining > 0 ? `TRAVADO  ${remaining}s` : 'DESBLOQUEADO');
                    },
                });

                // Após 10s: desbloqueio com fade-out suave
                this.time.delayedCall(10000, () => {
                    tick.destroy();
                    this.input.enabled = true;
                    this.boardLocked = false;
                    window.dispatchEvent(new CustomEvent('sudocidio:boardLocked', { detail: { locked: false } }));

                    this.tweens.add({
                        targets: [overlay, label, barTrack, bar],
                        alpha: 0,
                        duration: 350,
                        ease: 'Quad.In',
                        onComplete: () => {
                            overlay.destroy();
                            label.destroy();
                            barTrack.destroy();
                            bar.destroy();
                        },
                    });
                });
                break;
            }
        }
    }
}