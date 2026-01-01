
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
    let gameMode = 'pvc'; // 'pvp', 'pvc'
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

    let game;
    let ui;

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

        const playerNames = (gameMode === 'pvc')
            ? { P1: 'YOU', P2: 'DD' }
            : { P1: 'P1', P2: 'P2' };

        ui = new UI(game, playerNames);

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
        // Early exit conditions
        if (gameMode !== 'pvc') {
            console.log('[AI] Not PvC mode: gameMode=%s', gameMode);
            return;
        }

        if (game.gameOver) {
            console.log('[AI] Game is over');
            return;
        }

        const currentPlayer = game.getCurrentPlayer();
        if (currentPlayer !== 'P2') {
            console.log('[AI] Not AI turn: currentPlayer=%s', currentPlayer);
            return;
        }

        // Check if already processing
        if (isAiThinking) {
            console.log('[AI] Already thinking, skipping duplicate call');
            return;
        }

        // Start AI turn sequence
        console.log('[AI] ========== Starting AI turn sequence ==========');
        isAiThinking = true;

        try {
            aiStatus.classList.remove('hidden');
            ui.container.style.pointerEvents = 'none';

            let moveCount = 0;
            const maxChainMoves = 200; // Safety limit (increased for large grids and long endgame chains)

            while (game.getCurrentPlayer() === 'P2' && !game.gameOver && moveCount < maxChainMoves) {
                console.log('[AI] --- Move #%d ---', moveCount + 1);
                console.log('[AI] Current player: %s, Game over: %s', game.getCurrentPlayer(), game.gameOver);

                // Thinking delay
                const delay = moveCount === 0 ? 800 : 400;
                await new Promise(resolve => setTimeout(resolve, delay));

                // Verify still AI's turn after delay
                if (game.getCurrentPlayer() !== 'P2') {
                    console.log('[AI] No longer AI turn after delay, breaking');
                    break;
                }

                if (game.gameOver) {
                    console.log('[AI] Game ended during delay, breaking');
                    break;
                }

                // Get AI move
                let move;
                try {
                    move = ai.getMove(game);
                    console.log('[AI] getMove returned: %o', move);
                } catch (err) {
                    console.error('[AI] Exception in getMove:', err);
                    break;
                }

                if (!move) {
                    console.error('[AI] getMove returned null/undefined!');
                    console.error('[AI] Game state: player=%s, gameOver=%s, scores=%o',
                        game.getCurrentPlayer(), game.gameOver, game.scores);

                    // Check if there are actually moves available
                    const scoringMoves = ai.findScoringMoves(game);
                    const safeMoves = ai.findSafeMoves(game);
                    console.error('[AI] Available moves: %d scoring, %d safe',
                        scoringMoves.length, safeMoves.length);

                    break;
                }

                // Place the move
                let result;
                try {
                    result = game.placeLine(move.type, move.r, move.c);
                    console.log('[AI] placeLine result: success=%s, extraTurn=%s, squares=%d, newPlayer=%s',
                        result.success, result.extraTurn, result.newSquares?.length || 0, game.getCurrentPlayer());
                } catch (err) {
                    console.error('[AI] Exception in placeLine:', err);
                    break;
                }

                if (!result.success) {
                    console.error('[AI] Move failed! Move: %s(%d,%d)', move.type, move.r, move.c);
                    break;
                }

                // Update UI
                try {
                    ui.renderMove(move.type, move.r, move.c, result);
                    // updateStatus will call checkAiTurn, but isAiThinking flag prevents recursion
                    ui.updateStatus();
                } catch (err) {
                    console.error('[AI] Exception in UI update:', err);
                }

                moveCount++;

                // Check if chain continues
                if (!result.extraTurn) {
                    console.log('[AI] No extra turn, chain ended');
                    break;
                } else {
                    console.log('[AI] Extra turn granted, continuing chain...');
                }
            }

            if (moveCount >= maxChainMoves) {
                console.warn('[AI] Hit maximum chain moves limit!');

                // Make one final move to properly end the turn
                if (game.getCurrentPlayer() === 'P2' && !game.gameOver) {
                    console.warn('[AI] Making final move to end turn gracefully');

                    try {
                        const finalMove = ai.getMove(game);
                        if (finalMove) {
                            const finalResult = game.placeLine(finalMove.type, finalMove.r, finalMove.c);
                            console.log('[AI] Final move: %s(%d,%d), squares=%d',
                                finalMove.type, finalMove.r, finalMove.c, finalResult.newSquares?.length || 0);

                            // Update UI
                            ui.renderMove(finalMove.type, finalMove.r, finalMove.c, finalResult);
                            ui.updateStatus();

                            // Force turn to end even if final move captured squares
                            if (game.getCurrentPlayer() === 'P2') {
                                console.warn('[AI] Final move gave extra turn, forcefully ending turn');
                                game.currentPlayerIndex = 0; // Switch to P1
                            }
                        } else {
                            // No move available, force turn switch
                            console.warn('[AI] No final move available, forcing turn switch');
                            game.currentPlayerIndex = 0;
                        }
                    } catch (err) {
                        console.error('[AI] Error making final move:', err);
                        game.currentPlayerIndex = 0; // Switch to P1 on error
                    }
                }
            }

            console.log('[AI] ========== AI sequence complete ==========');
            console.log('[AI] Total moves: %d, Final player: %s, Game over: %s',
                moveCount, game.getCurrentPlayer(), game.gameOver);

        } catch (err) {
            console.error('[AI] Fatal error in checkAiTurn:', err);
        } finally {
            // Always cleanup, even if there was an error
            console.log('[AI] Cleaning up: re-enabling UI');
            ui.container.style.pointerEvents = 'auto';
            aiStatus.classList.add('hidden');
            isAiThinking = false;
            console.log('[AI] Cleanup complete, isAiThinking=%s', isAiThinking);
        }
    }

    // Rules Modal Handlers
    const rulesBtn = document.getElementById('rules-btn');
    const rulesModal = document.getElementById('rules-modal');
    const closeBtn = document.querySelector('.close-btn');

    rulesBtn.addEventListener('click', () => {
        rulesModal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
        rulesModal.classList.add('hidden');
    });

    // Close modal when clicking outside
    rulesModal.addEventListener('click', (e) => {
        if (e.target === rulesModal) {
            rulesModal.classList.add('hidden');
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !rulesModal.classList.contains('hidden')) {
            rulesModal.classList.add('hidden');
        }
    });

    // Initialize game with correct mode
    difficultyGroup.style.display = gameMode === 'pvc' ? 'flex' : 'none';
    startNewGame(rows, cols);

    console.log("DotDot initialized!");
});
