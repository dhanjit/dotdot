
/**
 * Main Entry Point
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check if GameState is loaded
    if (typeof GameState === 'undefined') {
        console.error("GameState class not loaded!");
        return;
    }

    // Default configuration (will be overridden by responsive check)
    let rows = 10;
    let cols = 10;

    // Responsive default calculation
    function calculateResponsiveDefaults() {
        // Assume dot spacing around 40px is comfortable for mobile, 30px for desktop maybe?
        // Let's check available screen space.
        // We want to fill the screen but leave header/footer.
        const width = window.innerWidth; // - margins
        const height = window.innerHeight; // - header/footer

        // Approximate available space
        const availW = Math.min(600, width - 40); // Max width 600px container
        const availH = height - 200; // Header/footer approx

        const idealSpacing = 35; // px

        const fitCols = Math.floor(availW / idealSpacing);
        const fitRows = Math.floor(availH / idealSpacing);

        // Min 3, Max 30
        const safeCols = Math.max(3, Math.min(30, fitCols));
        const safeRows = Math.max(3, Math.min(30, fitRows));

        return { r: safeRows, c: safeCols };
    }

    const defaults = calculateResponsiveDefaults();
    rows = defaults.r;
    cols = defaults.c;

    // Set input values
    const rowsInput = document.getElementById('grid-rows');
    const colsInput = document.getElementById('grid-cols');

    if (rowsInput) rowsInput.value = rows;
    if (colsInput) colsInput.value = cols;

    let game = new GameState(rows, cols);
    let ui = new UI(game);

    const restartBtn = document.getElementById('restart-btn');

    restartBtn.addEventListener('click', restartGame);

    // Add event listeners for inputs to restart on change (or maybe just on restart click? 
    // Usually immediate update is jarring, but let's stick to restart button trigger for explicit action
    // OR update on change. Let's do update on change for "live" feel if empty, but restart button is safer.
    // The previous select had change listener. 
    // Let's keep change listener but maybe debounce? 
    // Actually, explicit restart is better for Typed inputs. 
    // BUT the prompt implies "configurations for MxN grid... input boxes".
    // Let's make the restart button apply the changes.
    // The previous code had `gridSizeSelect.addEventListener('change', ...)`

    // Let's add listeners to inputs to restart game on change?
    // Unintended restarts while typing are annoying.
    // Let's rely on Restart Button to apply new sizing. 
    // But wait, the user might think they just set it. 
    // Let's auto-restart on 'change' (blur/enter), not 'input' (keystroke).
    rowsInput.addEventListener('change', restartGame);
    colsInput.addEventListener('change', restartGame);

    function restartGame() {
        let r = parseInt(rowsInput.value);
        let c = parseInt(colsInput.value);

        // Validation
        if (isNaN(r) || r < 3) r = 3;
        if (isNaN(c) || c < 3) c = 3;
        if (r > 50) r = 50; // Hard cap
        if (c > 50) c = 50;

        rowsInput.value = r; // Reflect fixed value
        colsInput.value = c;

        startNewGame(r, c);
    }

    function startNewGame(r, c) {
        game = new GameState(r, c);
        ui = new UI(game);
        console.log(`New game started with grid size ${r}x${c}`);
    }

    console.log("DotDot initialized!");
});
