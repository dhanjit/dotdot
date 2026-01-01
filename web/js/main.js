
/**
 * Main Entry Point
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check if GameState is loaded
    if (typeof GameState === 'undefined') {
        console.error("GameState class not loaded!");
        return;
    }

    // AI Configuration
    let gameMode = 'pvp'; // 'pvp', 'pvc'
    let aiDifficulty = 'greedy';
    let ai = new DotDotAI(aiDifficulty);
    let isAiThinking = false;

    // Elements
    const gameModeSelect = document.getElementById('game-mode');
    const difficultyGroup = document.getElementById('difficulty-group');
    const difficultySelect = document.getElementById('ai-difficulty');
    const aiStatus = document.getElementById('ai-status');

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

    // Handlers for controls
    gameModeSelect.addEventListener('change', (e) => {
        gameMode = e.target.value;
        difficultyGroup.style.display = gameMode === 'pvc' ? 'flex' : 'none';
        restartGame();
    });

    difficultySelect.addEventListener('change', (e) => {
        aiDifficulty = e.target.value;
        ai = new DotDotAI(aiDifficulty);
        // No need to restart, just updates strategy
    });

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

    // We need to intercept the UI turn switch to trigger AI
    // We can't modify UI.handleLineClick easily without access to UI class definition?
    // Actually UI.handleLineClick calls game.placeLine.
    // Ideally UI should emit an event or we should subclass UI? 
    // Or simpler: We modify UI class in ui.js to accept an "onTurnEnd" callback?
    // OR we just poll? Polling is bad.

    // Better approach: 
    // Modify UI class in `web/js/ui.js` to dispatch an event or call a callback.
    // BUT we are in main.js. 

    // Let's modify handleLineClick mechanism.
    // We can attach a listener to the game object? GameState doesn't emit events.

    // Let's patch UI.handleLineClick or pass a callback to UI constructor.
    // Since we can't change UI constructor signature easily without breaking existing tests?, 
    // let's just add a method to UI instance.

    function startNewGame(r, c) {
        game = new GameState(r, c);
        ui = new UI(game);

        // Setup AI Hooks
        // Override UI's updateStatus to detect turn change?
        const originalUpdateStatus = ui.updateStatus.bind(ui);
        ui.updateStatus = () => {
            originalUpdateStatus();
            checkAiTurn();
        };

        console.log(`New game started: ${r}x${c}, Mode: ${gameMode}`);
        checkAiTurn(); // In case AI goes first (currently P1 starts, but good practice)
    }

    async function checkAiTurn() {
        if (gameMode !== 'pvc' || game.gameOver) return;

        // P2 is AI
        if (game.getCurrentPlayer() === 'P2' && !isAiThinking) {
            isAiThinking = true;
            aiStatus.classList.remove('hidden');

            // Disable interaction
            ui.container.style.pointerEvents = 'none';

            // Simulate thinking delay
            await new Promise(resolve => setTimeout(resolve, 800));

            // Make move
            try {
                const move = ai.getMove(game);
                if (move) {
                    ui.handleLineClick(move.type, move.r, move.c);
                } else {
                    console.error("AI returned no move! Game might be stuck.");
                }
            } catch (e) {
                console.error("AI Error:", e);
            }

            // Cleanup
            ui.container.style.pointerEvents = 'auto';
            aiStatus.classList.add('hidden');
            isAiThinking = false;
        }
    }

    console.log("DotDot initialized!");
});
