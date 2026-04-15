// ui/entity-panel.component.ts
import type { GameEntities, PlacedEntity, Suspect, Victim, Weapon } from '../types/npc.registry';

export interface DragPayload {
    sourceType: 'panel' | 'map';
    entityId: string;          // unique key: entity name
    entityType: 'suspect' | 'victim' | 'weapon';
    fromTileX?: number;        // only when sourceType === 'map'
    fromTileY?: number;
}

/**
 * Sidebar panel that displays unplaced entities as draggable cards.
 * Suspects and weapons are shown in separate sections.
 */
class EntityPanel {
    private container!: HTMLDivElement;
    private suspectsSection!: HTMLDivElement;
    private weaponsSection!: HTMLDivElement;

    /** entityName → card element (for removing when placed) */
    private cards: Map<string, HTMLDivElement> = new Map();

    constructor(
        private parent: HTMLElement,
        private onDragStart: (payload: DragPayload) => void
    ) {
        this.build();
    }

    // ─── Build ────────────────────────────────────────────────────────────────

    private build(): void {
        this.container = document.createElement('div');
        Object.assign(this.container.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '160px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: '1000',
            fontFamily: "'Courier New', monospace",
            fontSize: '11px',
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto',
        });

        this.suspectsSection = this.buildSection('SUSPEITOS', '#ff6666');
        this.weaponsSection  = this.buildSection('ARMAS',     '#66b3ff');

        this.parent.appendChild(this.container);
    }

    private buildSection(title: string, accentColor: string): HTMLDivElement {
        const panel = document.createElement('div');
        Object.assign(panel.style, {
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(4px)',
            borderRadius: '8px',
            padding: '10px',
            border: `1px solid rgba(255,152,0,0.3)`,
        });

        const heading = document.createElement('div');
        Object.assign(heading.style, {
            color: accentColor,
            fontWeight: 'bold',
            fontSize: '10px',
            marginBottom: '8px',
            letterSpacing: '1px',
        });
        heading.textContent = title;
        panel.appendChild(heading);

        const list = document.createElement('div');
        Object.assign(list.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
        });
        panel.appendChild(list);

        this.container.appendChild(panel);
        return list; // return the list div, not the outer panel
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    /** Populate the panel from the full entity set. */
    populate(entities: GameEntities): void {
        this.suspectsSection.innerHTML = '';
        this.weaponsSection.innerHTML  = '';
        this.cards.clear();

        // Suspects (includes the murderer — the player must figure that out)
        for (const placed of entities.suspects) {
            const suspect = placed.entity as Suspect;
            this.addCard(suspect.name, 'suspect', this.suspectsSection, '#ff6666');
        }

        // Victim
        const victim = entities.victim.entity as Victim;
        this.addCard(victim.name, 'victim', this.suspectsSection, '#ff9966');

        // Weapons
        for (const placed of entities.weapons) {
            const weapon = placed.entity as Weapon;
            this.addCard(weapon.name, 'weapon', this.weaponsSection, '#66b3ff');
        }
    }

    /** Hide a card when its entity has been placed on the map. */
    markPlaced(entityName: string): void {
        const card = this.cards.get(entityName);
        if (card) card.style.display = 'none';
    }

    /** Show a card again when its entity is removed from the map. */
    markUnplaced(entityName: string): void {
        const card = this.cards.get(entityName);
        if (card) card.style.display = 'flex';
    }

    destroy(): void {
        this.container.remove();
    }

    // ─── Card building ────────────────────────────────────────────────────────

    private addCard(
        name: string,
        entityType: 'suspect' | 'victim' | 'weapon',
        section: HTMLDivElement,
        accentColor: string
    ): void {
        const card = document.createElement('div');
        Object.assign(card.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${accentColor}44`,
            borderRadius: '4px',
            padding: '5px 7px',
            cursor: 'grab',
            userSelect: 'none',
            color: '#ddd',
            fontSize: '10px',
            transition: 'background 0.15s, border-color 0.15s',
        });

        // Coloured dot
        const dot = document.createElement('div');
        Object.assign(dot.style, {
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: accentColor,
            flexShrink: '0',
        });
        card.appendChild(dot);

        const label = document.createElement('span');
        label.textContent = name;
        label.style.overflow = 'hidden';
        label.style.textOverflow = 'ellipsis';
        label.style.whiteSpace = 'nowrap';
        card.appendChild(label);

        // Hover
        card.addEventListener('mouseenter', () => {
            card.style.background = 'rgba(255,255,255,0.12)';
            card.style.borderColor = accentColor + 'aa';
        });
        card.addEventListener('mouseleave', () => {
            card.style.background = 'rgba(255,255,255,0.05)';
            card.style.borderColor = accentColor + '44';
        });

        // Drag start — store payload in dataTransfer
        card.draggable = true;
        card.addEventListener('dragstart', (e) => {
            const payload: DragPayload = {
                sourceType: 'panel',
                entityId: name,
                entityType,
            };
            e.dataTransfer!.setData('text/plain', JSON.stringify(payload));
            e.dataTransfer!.effectAllowed = 'move';
            card.style.opacity = '0.4';
            this.onDragStart(payload);
        });
        card.addEventListener('dragend', () => {
            card.style.opacity = '1';
        });

        this.cards.set(name, card);
        section.appendChild(card);
    }
}

export default EntityPanel;