// ui/HUD.styles.ts
const HUDStyles = {
    container: {
        position: 'fixed' as const,
        top: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '10px',
        zIndex: '1000',
        fontFamily: "'Courier New', monospace",
        fontSize: '12px'
    },
    panel: {
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(4px)',
        borderRadius: '8px',
        padding: '8px 12px',
        border: '1px solid rgba(255, 152, 0, 0.3)'
    },
    roomInfo: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '4px',
        minWidth: '50px'
    },
    seedRow: {
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
    },
    label: {
        color: '#ffd700',
        fontSize: '11px'
    },
    coordLabel: {
        color: '#aaa',
        fontSize: '10px'
    },
    input: {
        background: '#2a2a2a',
        border: '1px solid #ff9800',
        borderRadius: '4px',
        padding: '4px 8px',
        color: '#fff',
        fontSize: '11px',
        fontFamily: "'Courier New', monospace",
        outline: 'none'
    },
    button: {
        background: '#ff9800',
        border: 'none',
        borderRadius: '4px',
        padding: '4px 12px',
        color: '#1a1a2e',
        fontWeight: 'bold',
        fontSize: '11px',
        cursor: 'pointer',
        fontFamily: "'Courier New', monospace",
        transition: 'all 0.2s',
        '&:hover': {
            background: '#ffb74d'
        }
    },
    hintsPanel: {
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(4px)',
        borderRadius: '8px',
        padding: '10px',
        border: '1px solid rgba(255, 152, 0, 0.3)',
        width: '180px',
    },
    hintsContainer: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px',
        marginBottom: '10px',
        // Estilização da scrollbar para WebKit (Chrome, Safari, Edge)
        scrollbarWidth: 'thin' as const,
        scrollbarColor: '#ff9800 #2a2a2a'
    },
    hintButton: {
        background: '#ff9800',
        border: 'none',
        borderRadius: '4px',
        padding: '6px 12px',
        color: '#1a1a2e',
        fontWeight: 'bold',
        fontSize: '11px',
        cursor: 'pointer',
        fontFamily: "'Courier New', monospace",
        width: '100%',
        transition: 'all 0.2s',
        marginBottom: '10px',
        '&:hover': {
            background: '#ffb74d'
        }
    },
    hintsLog: {
        borderTop: '1px solid rgba(255, 152, 0, 0.3)',
        paddingTop: '8px',
        // Estilização da scrollbar para WebKit (Chrome, Safari, Edge)
        scrollbarWidth: 'thin' as const,
        scrollbarColor: '#ff9800 #2a2a2a'
    }
};

// Estilos globais para scrollbar (funciona em todos os elementos)
const scrollbarStyles = `
    /* WebKit (Chrome, Safari, Edge) */
    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    
    ::-webkit-scrollbar-track {
        background: #2a2a2a;
        border-radius: 3px;
    }
    
    ::-webkit-scrollbar-thumb {
        background: #ff9800;
        border-radius: 3px;
        transition: background 0.2s;
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: #ffb74d;
    }
    
    /* Firefox */
    * {
        scrollbar-width: thin;
        scrollbar-color: #ff9800 #2a2a2a;
    }
`;

// Aplica os estilos globais se estiver no browser
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = scrollbarStyles;
    document.head.appendChild(styleElement);
}

export default HUDStyles;