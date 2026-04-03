const GAME_RESOURCES = {
    COLORS: {
        background: '#0A1918',
        border: '#688C88',
        borderShadow: '#556967',

        paddle: '#3D8880',
        paddleHighlight: 'rgba(255,255,255,0.7)',

        ballLight: '#A9F5ED',
        ballMain: '#65B0A8',
        ballShadow: '#21988C',

        textHUD: '#C8F1ED',
        textReady: 'rgba(255,255,255,0.9)',
        textPaused: '#AFE3DE',
        textGameOver: '#39948A',
        textLevelClear: '#AFE3DE',

        bricks: [
            '#145952',
            '#3D6762',
            '#3D6762',
            '#3E8981',
            '#3E8981',
            '#74C4BB',
            '#74C4BB',
            '#89C4BE'
        ],

        brickHighlight: 'rgba(255,255,255,0.25)',
        brickStroke: '#D6F5F1',
        brickDoubleHit: '#91B0AD',

        overlayPaused: 'rgba(0,0,0,0.75)',
        overlayGameOver: 'rgba(0,0,0,0.85)',

        textFinalScore: '#CAF5F0',

        containerBackground: '#091816',
        crtScanline: 'rgba(255,255,255,0.03)',
        glowCyan: 'rgba(127, 146, 144, 0.4)',
        glowInner: 'rgba(0, 55, 255, 0.12)'
    },

    SIZES: {
        paddleWidth: 96,
        paddleHeight: 14,
        ballRadius: 9,
        brickWidth: 64,
        brickHeight: 22,
        brickPadding: 6
    },

    SETTINGS: {
        paddleSpeed: 9,
        ballBaseSpeed: 6.2,
        initialLives: 3,
        brickRows: 8,
        brickCols: 10,
        levelOffsetY: 72,
        wallPadding: 8,
        ballOffsetFromPaddle: 2
    }
};

function applyColorsToCSS() {
    const R = GAME_RESOURCES.COLORS;
    const root = document.documentElement;

    root.style.setProperty('--color-background', R.background);
    root.style.setProperty('--color-border', R.border);
    root.style.setProperty('--color-border-shadow', R.borderShadow);

    root.style.setProperty('--container-background', R.containerBackground);
    root.style.setProperty('--crt-scanline', R.crtScanline);
    root.style.setProperty('--glow-cyan', R.glowCyan);
    root.style.setProperty('--glow-inner', R.glowInner);
}

applyColorsToCSS();