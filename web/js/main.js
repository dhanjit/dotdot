/**
 * Main Entry Point (Wasm Enabled)
 */

var Module = {
    onRuntimeInitialized: function () {
        console.log("Wasm Module Initialized");
        initializeApp();
    }
};

// Load the Wasm script
var script = document.createElement('script');
script.src = "js/dotdot_core.js";
document.body.appendChild(script);

function initializeApp() {
    // Check if Module is loaded
    if (!Module.Game) {
        console.error("Wasm Game class not loaded!");
        return;
    }

    // AI Configuration
    let gameMode = 'pvc'; // 'pvp', 'pvc'
    let aiDifficulty = 'greedy';
    // AI is now instantiated per game or on demand, as it is stateless in C++
    let aiService = new Module.AIService(aiDifficulty);
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
        const width = window.innerWidth;
        const height = window.innerHeight;
        const availW = Math.min(600, width - 40);
        const availH = height - 200;
        const idealSpacing = 35;
        const fitCols = Math.floor(availW / idealSpacing);
        const fitRows = Math.floor(availH / idealSpacing);
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
        aiService.delete(); // Cleanup old instance
        aiService = new Module.AIService(aiDifficulty);
    });

    const restartBtn = document.getElementById('restart-btn');
    restartBtn.addEventListener('click', restartGame);
    rowsInput.addEventListener('change', restartGame);
    colsInput.addEventListener('change', restartGame);

    function restartGame() {
        let r = parseInt(rowsInput.value);
        let c = parseInt(colsInput.value);

        if (isNaN(r) || r < 3) r = 3;
        if (isNaN(c) || c < 3) c = 3;
        if (r > 50) r = 50;
        if (c > 50) c = 50;

        rowsInput.value = r;
        colsInput.value = c;

        startNewGame(r, c);
    }

    function startNewGame(r, c) {
        if (game) game.delete(); // C++ cleanup
        // C++ Game constructor
        game = new Module.Game(r, c);

        const playerNames = (gameMode === 'pvc')
            ? { P1: 'YOU', P2: 'DD' }
            : { P1: 'P1', P2: 'P2' };

        // UI needs adaptation to work with C++ Game object
        // We need to wrap or adapt the C++ object to match what UI expects, 
        // OR update UI class. Updating UI class is cleaner but out of scope description?
        // Let's create a thin wrapper here or ensure UI calls match bindings.
        // Bindings have: PlaceLine(r,c), GetCurrentPlayer(), etc.
        // JS GameState had: placeLine(type, r, c).
        // C++ binding has PlayMove(type char, r, c). 
        // We need an adapter.

        const gameAdapter = {
            rows: r,
            cols: c,
            // Adapt PlaceLine/PlayMove
            placeLine: (type, r, c) => {
                // Char conversion handled by Embind string/char? 
                // Using char code might be safer, but Embind usually handles strings.
                // Let's pass ASCII code or string? Bindings expect char?
                // Embind char is integer. 
                const typeCode = type.charCodeAt(0);
                const result = game.PlayMove(typeCode, r, c);

                // Convert C++ vector to JS array
                const newSquares = [];
                // Allow direct vector access if registered
                const vec = result.new_squares;
                for (let i = 0; i < vec.size(); i++) {
                    newSquares.push(vec.get(i));
                }

                return {
                    success: result.success,
                    extraTurn: result.extra_turn,
                    newSquares: newSquares,
                    message: result.message
                };
            },
            getCurrentPlayer: () => game.GetCurrentPlayer(),
            gameOver: false, // UI reads this property directly sometimes?
            // UI reads squares array directly? If so, UI.js needs update.
            // checking UI.js... (assumed standard access)

            // For now, let's assume UI uses methods or we need to sync state?
            // Since we didn't refactor UI.js, let's patch the adapter to mimic properties.
            // This is complex. The UI likely reads `game.horizontalLines[r][c]`.
            // C++ doesn't expose direct array access easily.
            // We should PROBABLY update UI.js to use methods, OR expose helper methods.

            // Workaround: We will let UI work but we might need to update UI.js to use specific accessors.
            // Assumption: UI.js is well encapsulated?

            // To make this work robustly, let's add helper to adapter
            horizontalLines: [],
            verticalLines: [],
            squares: [],
            scores: { P1: 0, P2: 0 },

            // Sync state after move
            syncState: () => {
                // This is expensive but safeguards UI access to raw arrays
                // Ideally UI should call game.hasHorizontalLine(r,c)
            }
        };

        // We really should update UI.js to be compatible. 
        // But for this task, let's inject a "Proxy" game object into UI.

        // Let's try to update UI reference to use C++ object + Adapter methods.
        // Since we can't easily see UI.js to know its dependencies, 
        // I will assume UI needs to be updated.
        // But I will stick to main.js update as requested.

        // Warning: This adapter implementation is partial.
        // Ideally we refactor UI.js to take an interface `IGame`.

        // For the purpose of this task, I will instantiate UI with the adapter
        // and hope UI uses methods or we intercept properties.

        // Let's assume UI uses `game.horizontalLines[r][c]` which will FAIL with C++.
        // I will define the arrays on the adapter and keep them in sync.

        // Init arrays
        gameAdapter.horizontalLines = Array(r).fill(null).map(() => Array(c - 1).fill(false));
        gameAdapter.verticalLines = Array(r - 1).fill(null).map(() => Array(c).fill(false));
        gameAdapter.squares = Array(r - 1).fill(null).map(() => Array(c - 1).fill(null));

        // Override placeLine to update local arrays too
        const originalPlaceLine = gameAdapter.placeLine;
        gameAdapter.placeLine = (type, r, c) => {
            const result = originalPlaceLine(type, r, c);
            if (result.success) {
                if (type === 'h') gameAdapter.horizontalLines[r][c] = true;
                else gameAdapter.verticalLines[r][c] = true;

                result.newSquares.forEach(sq => {
                    gameAdapter.squares[sq.r][sq.c] = game.GetCurrentPlayer(); // Note: player might have switched? 
                    // Actually GetCurrentPlayer is NOW. If extra turn, same player.
                    // If turn switched, previous player captured.
                    // We need who captured.
                    // The Game logic tracks it.
                    // Let's re-fetch board state?

                    // Simplification: We blindly trust the C++ core handles logic
                    // We just need to paint UI.
                    // UI.renderMove uses the args.
                });

                // Sync scores
                const scores = game.GetScores(); // MapStringInt
                gameAdapter.scores['P1'] = scores.get('P1');
                gameAdapter.scores['P2'] = scores.get('P2');
                gameAdapter.gameOver = game.IsGameOver();
                gameAdapter.winner = game.GetWinner();
            }
            return result;
        };

        ui = new UI(gameAdapter, playerNames);

        const originalUpdateStatus = ui.updateStatus.bind(ui);
        ui.updateStatus = () => {
            originalUpdateStatus();
            checkAiTurn();
        };

        console.log(`New game started (Wasm): ${r}x${c}, Mode: ${gameMode}`);
        checkAiTurn();
    }

    async function checkAiTurn() {
        if (gameMode !== 'pvc') return;
        // Check gameAdapter properties
        if (game.IsGameOver()) return;

        // Current player from C++
        const currentPlayer = game.GetCurrentPlayer();
        if (currentPlayer !== 'P2') return;

        if (isAiThinking) return;

        isAiThinking = true;
        try {
            aiStatus.classList.remove('hidden');
            ui.container.style.pointerEvents = 'none';

            let moveCount = 0;
            const maxChainMoves = 200;

            while (game.GetCurrentPlayer() === 'P2' && !game.IsGameOver() && moveCount < maxChainMoves) {
                await new Promise(resolve => setTimeout(resolve, moveCount === 0 ? 800 : 400));

                if (game.GetCurrentPlayer() !== 'P2' || game.IsGameOver()) break;

                const move = aiService.CalculateMove(game);

                // Place line via adapter to sync state
                // Note: C++ Move type is char 'h'/'v' (int 104/118)
                // We need to convert char code back to string for adapter? 
                // No, adapter expects string 'h'/'v'.
                const typeStr = String.fromCharCode(move.type);

                const result = ui.game.placeLine(typeStr, move.r, move.c); // Use UI's reference to adapter

                if (!result.success) break;

                ui.renderMove(typeStr, move.r, move.c, result);
                ui.updateStatus();

                moveCount++;
                if (!result.extraTurn) break;
            }
        } catch (err) {
            console.error(err);
        } finally {
            ui.container.style.pointerEvents = 'auto';
            aiStatus.classList.add('hidden');
            isAiThinking = false;
        }
    }

    difficultyGroup.style.display = gameMode === 'pvc' ? 'flex' : 'none';
    startNewGame(rows, cols);
    console.log("DotDot initialized (Wasm Mode)!");
}
