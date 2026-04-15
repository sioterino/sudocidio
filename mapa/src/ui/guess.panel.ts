// ui/guess-panel.component.ts
import DOMHelpers from '../utils/DOM.utils';

export interface Accusation {
    murdererName: string;
    weaponName: string;
}

/**
 * A compact panel at the bottom of the HUD that lets the player
 * submit their final accusation once all entities are placed.
 */
class GuessPanel {
    private container!: HTMLDivElement;
    private murdererSelect!: HTMLSelectElement;
    private weaponSelect!: HTMLSelectElement;
    private submitBtn!: HTMLButtonElement;
    private resultDiv!: HTMLDivElement;
    private onSubmit: ((accusation: Accusation) => boolean) | null = null;

    constructor(private parent: HTMLElement) {
        this.build();
    }

    // ─── Build ────────────────────────────────────────────────────────────────

    private build(): void {
        this.container = document.createElement('div');
        Object.assign(this.container.style, {
            position: 'fixed',          // <-- add this
            bottom: '10px',             // <-- distance from bottom
            right: '10px',               // <-- distance from left

            background: 'rgba(0,0,0,0.90)',
            backdropFilter: 'blur(4px)',
            borderRadius: '8px',
            padding: '10px',
            border: '1px solid rgba(255,152,0,0.3)',
            fontFamily: "'Courier New', monospace",
            fontSize: '11px',
            zIndex: '9999',             // <-- ensure it stays above other UI
        });

        const title = document.createElement('div');
        Object.assign(title.style, {
            color: '#ffd700',
            fontWeight: 'bold',
            fontSize: '10px',
            marginBottom: '8px',
            letterSpacing: '1px',
            textAlign: 'center',
        });
        title.textContent = 'ACUSAÇÃO';
        this.container.appendChild(title);

        // Murderer row
        this.container.appendChild(this.rowLabel('Assassino:'));
        this.murdererSelect = this.buildSelect();
        this.container.appendChild(this.murdererSelect);

        // Weapon row
        this.container.appendChild(this.rowLabel('Arma:'));
        this.weaponSelect = this.buildSelect();
        this.container.appendChild(this.weaponSelect);

        // Submit button
        this.submitBtn = document.createElement('button');
        Object.assign(this.submitBtn.style, {
            background: '#e53935',
            border: 'none',
            borderRadius: '4px',
            padding: '5px',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '11px',
            cursor: 'pointer',
            fontFamily: "'Courier New', monospace",
            width: '100%',
            marginTop: '8px',
        });
        this.submitBtn.textContent = 'Acusar!';
        this.submitBtn.addEventListener('click', () => this.handleSubmit());
        this.container.appendChild(this.submitBtn);

        // Result display
        this.resultDiv = document.createElement('div');
        Object.assign(this.resultDiv.style, {
            marginTop: '6px',
            fontSize: '11px',
            textAlign: 'center',
            minHeight: '10px',
            color: '#ccc',
        });
        this.container.appendChild(this.resultDiv);

        this.parent.appendChild(this.container);
    }

    private rowLabel(text: string): HTMLDivElement {
        const el = document.createElement('div');
        Object.assign(el.style, {
            color: '#aaa',
            fontSize: '10px',
            marginBottom: '2px',
            marginTop: '6px',
        });
        el.textContent = text;
        return el;
    }

    private buildSelect(): HTMLSelectElement {
        const sel = document.createElement('select');
        Object.assign(sel.style, {
            background: '#2a2a2a',
            border: '1px solid #ff9800',
            borderRadius: '4px',
            padding: '4px 6px',
            color: '#fff',
            fontSize: '10px',
            fontFamily: "'Courier New', monospace",
            width: '100%',
            outline: 'none',
        });
        return sel;
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    /** Populate the dropdowns with suspect and weapon names. */
    populate(suspectNames: string[], weaponNames: string[]): void {
        this.fillSelect(this.murdererSelect, suspectNames);
        this.fillSelect(this.weaponSelect, weaponNames);
        this.resultDiv.textContent = '';
    }

    /** Register a callback invoked when the player submits.
     *  The callback should return `true` if the accusation is correct. */
    setOnSubmit(fn: (accusation: Accusation) => boolean): void {
        this.onSubmit = fn;
    }

    /** Show a hint that they should place all entities first. */
    showMustPlaceAll(): void {
        this.resultDiv.style.color = '#ff9800';
        this.resultDiv.textContent = 'Posicione todos primeiro!';
        setTimeout(() => { this.resultDiv.textContent = ''; }, 2500);
    }

    destroy(): void {
        this.container.remove();
    }

    // ─── Private ──────────────────────────────────────────────────────────────

    private fillSelect(sel: HTMLSelectElement, names: string[]): void {
        sel.innerHTML = '';
        for (const name of names) {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            sel.appendChild(opt);
        }
    }

    private handleSubmit(): void {
        if (!this.onSubmit) return;

        const accusation: Accusation = {
            murdererName: this.murdererSelect.value,
            weaponName: this.weaponSelect.value,
        };

        const correct = this.onSubmit(accusation);

        if (correct) {
            this.resultDiv.style.color = '#4caf50';
            this.resultDiv.textContent = '🎉 Correto! Caso encerrado!';
            this.submitBtn.disabled = true;
            this.submitBtn.style.opacity = '0.5';
        } else {
            this.resultDiv.style.color = '#e53935';
            this.resultDiv.textContent = '✗ Errado. Tente novamente.';
        }
    }
}

export default GuessPanel;