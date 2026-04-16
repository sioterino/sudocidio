// ui/HUD.component.ts
import DOMHelpers from '../utils/DOM.utils';
import HUDStyles from './HUD.styles';
import type { EntityHintSet, Hint } from '../generators/hint.generator';

class HUDComponents {

    public roomLabel: HTMLSpanElement;
    public entityLabel: HTMLSpanElement;
    public coordLabel: HTMLSpanElement;
    public seedLabel: HTMLSpanElement;
    public seedInput: HTMLInputElement;
    public goButton: HTMLButtonElement;
    
    // Novos elementos para dicas
    public hintsContainer: HTMLDivElement;
    public newHintButton: HTMLButtonElement;
    public hintsLogContainer: HTMLDivElement;
    private onNewHintRequested: (() => void) | null = null;

    constructor(parent: HTMLElement, initialSeed: number) {

        const container = DOMHelpers.createStyledElement('div', HUDStyles.container);
        
        // ========== TOP SECTION (room info + seed) ==========
        const topSection = DOMHelpers.createStyledElement('div', {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '10px'
        }, container);
        
        // Room info panel
        const roomInfoPanel = DOMHelpers.createStyledElement('div', { 
            ...HUDStyles.panel, 
            ...HUDStyles.roomInfo,
            height: '80px'
        }, topSection);
        
        this.coordLabel = DOMHelpers.createStyledElement('span', HUDStyles.coordLabel, roomInfoPanel);
        this.roomLabel = DOMHelpers.createStyledElement('span', HUDStyles.label, roomInfoPanel);
        this.entityLabel = DOMHelpers.createStyledElement('span', HUDStyles.label, roomInfoPanel);
        
        // Seed control panel
        const seedPanel = DOMHelpers.createStyledElement('div', { 
            ...HUDStyles.panel, 
            ...HUDStyles.seedRow,
            height: '50px'
        }, topSection);
        
        this.seedLabel = DOMHelpers.createStyledElement('span', { color: 'rgba(0,0,0,0.8)' }, seedPanel);
        this.seedInput = DOMHelpers.createStyledElement('input', HUDStyles.input, seedPanel);
        this.goButton = DOMHelpers.createStyledElement('button', HUDStyles.button, seedPanel);
        
        // ========== BOTTOM SECTION (hints) ==========
        const bottomSection = DOMHelpers.createStyledElement('div', {
            marginTop: '10px'
        }, container);
        
        // Hints panel
        const hintsPanel = DOMHelpers.createStyledElement('div', {
            ...HUDStyles.hintsPanel,
            height: '500px',
            display: 'flex',
            flexDirection: 'column'
        }, bottomSection);
        
        const hintsTitle = DOMHelpers.createStyledElement('h3', { 
            margin: '0 0 10px 0', 
            fontSize: '14px', 
            color: '#ffd700',
            textAlign: 'center',
            flexShrink: '0'
        }, hintsPanel);
        hintsTitle.textContent = 'DICAS';
        
        // Hints container (dicas iniciais dos suspeitos) - com scroll customizado
        this.hintsContainer = DOMHelpers.createStyledElement('div', {
            ...HUDStyles.hintsContainer,
            height: '250px',
            flexShrink: '0',
            overflowY: 'auto'
        }, hintsPanel);

        // apply unsupported CSS отдельно
        (this.hintsContainer.style as any).scrollbarWidth = 'thin';
        (this.hintsContainer.style as any).scrollbarColor = '#ff9800 #2a2a2a';
        
        // Adiciona classe para scroll customizado
        this.hintsContainer.classList.add('custom-scroll');
        
        // Botão nova dica
        this.newHintButton = DOMHelpers.createStyledElement('button', {
            ...HUDStyles.hintButton,
            height: '32px',
            flexShrink: '0'
        }, hintsPanel);
        this.newHintButton.textContent = 'Nova Dica';
        this.newHintButton.onclick = () => {
            if (this.onNewHintRequested) this.onNewHintRequested();
        };
        
        // Hints log container (histórico) - com scroll customizado
        this.hintsLogContainer = DOMHelpers.createStyledElement('div', {
            ...HUDStyles.hintsLog,
            height: '120px',
            flexShrink: '0',
            overflowY: 'auto'
        }, hintsPanel);

        // apply unsupported CSS отдельно
        (this.hintsLogContainer.style as any).scrollbarWidth = 'thin';
        (this.hintsLogContainer.style as any).scrollbarColor = '#ff9800 #2a2a2a';
        
        this.hintsLogContainer.classList.add('custom-scroll');
        
        parent.appendChild(container);
        
        // Initialize content
        this.seedLabel.textContent = `seed: ${initialSeed}`;
        this.coordLabel.textContent = 'x — y —';
        this.roomLabel.textContent = '—';
        this.seedInput.placeholder = 'new seed…';
        this.goButton.textContent = 'go';
    }
    
    setOnNewHintRequested(callback: () => void): void {
        this.onNewHintRequested = callback;
    }

    updateSeed(seed: number): void {
        this.seedLabel.textContent = `seed: ${seed}`;
    }

    updateRoom(roomName: string): void {
        this.roomLabel.textContent = roomName;
    }

    updateEntity(entityInfo: string | null): void {
        this.entityLabel.textContent = entityInfo || '';
    }

    updateCoordinates(x: number, y: number): void {
        this.coordLabel.textContent = `x ${x}  y ${y}`;
    }

    clearRoomInfo(): void {
        this.roomLabel.textContent = '—';
        this.entityLabel.textContent = '';
        this.coordLabel.textContent = 'x —  y —';
    }

    getSeedValue(): string | undefined {
        const value = this.seedInput.value.trim();
        return value || undefined;
    }

    clearInput(): void {
        this.seedInput.value = '';
    }
    
    // Métodos para dicas
    displayInitialHints(hintSets: EntityHintSet[]): void {
        if (!this.hintsContainer) return;
        
        if (hintSets.length === 0) {
            this.hintsContainer.innerHTML = '<div style="color: #888; text-align: center;">Nenhuma dica disponível</div>';
            return;
        }
        
        let html = '';
        
        hintSets.forEach(hintSet => {
            const name = hintSet.entity.entity.name;
            const hints = hintSet.initialHints;
            
            const hintsHtml = hints.map(h => `
                <div style="margin-bottom: 4px;">
                    <span style="color:#ff9800;">[${h.level}]</span>
                    <span style="color:#ccc;"> ${h.text}</span>
                </div>
            `).join('');
            
            html += `
                <div style="background: rgba(0,0,0,0.5); border-radius: 6px; padding: 8px; margin-bottom: 10px; border-left: 3px solid #ff4444;">
                    <div style="font-weight: bold; font-size: 12px; color: #ff6666; margin-bottom: 5px;">${name}</div>
                    ${hintsHtml}
                </div>
            `;
        });
        
        this.hintsContainer.innerHTML = html;
    }
    
    addHintToLog(hint: Hint): void {
        if (!this.hintsLogContainer) return;
        
        const hintEntry = DOMHelpers.createStyledElement('div', {
            background: 'rgba(255, 152, 0, 0.15)',
            borderLeft: '2px solid #ff9800',
            padding: '6px',
            marginBottom: '5px',
            fontSize: '10px',
            borderRadius: '3px',
            flexShrink: '0'
        });
        
        hintEntry.innerHTML = `<strong style="color: #ff9800;">${hint.entityName}:</strong> <span style="color: #ccc;">${hint.text}</span>`;
        
        this.hintsLogContainer.insertBefore(hintEntry, this.hintsLogContainer.firstChild);
        
        // Keep only last 15 hints
        while (this.hintsLogContainer.children.length > 15) {
            this.hintsLogContainer.removeChild(this.hintsLogContainer.lastChild!);
        }
    }
    
    updateUnplacedCount(count: number): void {
        if (this.hintsContainer) {
            const existingCount = this.hintsContainer.querySelector('.unplaced-count');
            if (existingCount) existingCount.remove();
        }
    }
}

export default HUDComponents