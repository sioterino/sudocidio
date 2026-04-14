class DOMHelpers {
    
    static createStyledElement<K extends keyof HTMLElementTagNameMap>(
        tagName: K, styles: Partial<CSSStyleDeclaration>, parent?: HTMLElement
    ): HTMLElementTagNameMap[K] {

        const element = document.createElement(tagName);
        Object.assign(element.style, styles);

        if (parent) parent.appendChild(element);
        return element;

    }

    static removeElementById(id: string): void {
        const element = document.getElementById(id);
        if (element) element.remove();
    }
}

export default DOMHelpers