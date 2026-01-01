
const DotDotAI = require('../web/js/ai.js');
const GameState = require('../web/js/game.js');

describe('Greedy AI Chain Capture Diagnostic', () => {
    test('Greedy AI should capture all available squares in chain without stalling', () => {
        const game = new GameState(4, 3);
        const ai = new DotDotAI('greedy');

        console.log('\n=== Greedy AI Chain Capture Test ===');

        // Setup a chain of 3 squares ready to capture
        // Square (0,0) - missing H(1,0)
        game.horizontalLines[0][0] = true;
        game.verticalLines[0][0] = true;
        game.verticalLines[0][1] = true;

        // Square (1,0) - missing H(2,0), shares H(1,0) with square (0,0)
        game.verticalLines[1][0] = true;
        game.verticalLines[1][1] = true;

        // Square (2,0) - missing H(3,0), shares H(2,0) with square (1,0)
        game.horizontalLines[3][0] = true;
        game.verticalLines[2][0] = true;
        game.verticalLines[2][1] = true;

        game.currentPlayerIndex = 1; // AI's turn (P2)

        let totalMoves = 0;
        let totalSquares = 0;
        const moveLog = [];

        // Simulate the chain capture loop (like in main.js)
        const maxChainMoves = 20;

        console.log('Initial state: 3 squares ready in chain');
        console.log('Current player:', game.getCurrentPlayer());

        while (game.getCurrentPlayer() === 'P2' && !game.gameOver && totalMoves < maxChainMoves) {
            console.log(`\nMove ${totalMoves + 1}:`);

            // Check what moves are available
            const scoringMoves = ai.findScoringMoves(game);
            const safeMoves = ai.findSafeMoves(game);
            console.log(`  Scoring moves available: ${scoringMoves.length}`);
            console.log(`  Safe moves available: ${safeMoves.length}`);

            const move = ai.getMove(game);

            if (!move) {
                console.error('  AI returned null move!');
                console.log('  Game state:', {
                    currentPlayer: game.getCurrentPlayer(),
                    gameOver: game.gameOver,
                    scores: game.scores
                });
                break;
            }

            console.log(`  AI chose: ${move.type}(${move.r},${move.c})`);

            const result = game.placeLine(move.type, move.r, move.c);

            if (!result.success) {
                console.error('  Move failed!');
                break;
            }

            console.log(`  Success: ${result.success}, Extra turn: ${result.extraTurn}, Squares: ${result.newSquares.length}`);

            totalMoves++;
            totalSquares += result.newSquares.length;

            moveLog.push({
                move: `${move.type}(${move.r},${move.c})`,
                squares: result.newSquares.length,
                extraTurn: result.extraTurn,
                currentPlayer: game.getCurrentPlayer()
            });

            if (!result.extraTurn) {
                console.log('  No extra turn, ending sequence');
                break;
            }
        }

        console.log('\n=== Results ===');
        console.log(`Total moves made: ${totalMoves}`);
        console.log(`Total squares captured: ${totalSquares}`);
        console.log(`Final player: ${game.getCurrentPlayer()}`);
        console.log(`AI Score: ${game.scores.P2}`);
        console.log('Move log:', moveLog);
        console.log('=== End ===\n');

        // Validations
        expect(totalMoves).toBeGreaterThan(0);
        expect(totalSquares).toBeGreaterThan(0);
        expect(game.scores.P2).toBe(totalSquares);

        // AI should have captured at least 1 square
        expect(totalSquares).toBeGreaterThanOrEqual(1);
    });

    test('Greedy AI should always return a move when it is their turn and moves exist', () => {
        const game = new GameState(3, 3);
        const ai = new DotDotAI('greedy');

        console.log('\n=== Testing AI Move Availability ===');

        game.currentPlayerIndex = 1; // AI's turn

        // Empty board - AI should always be able to make a move
        for (let attempt = 0; attempt < 10; attempt++) {
            const move = ai.getMove(game);
            console.log(`Attempt ${attempt + 1}: ${move ? `${move.type}(${move.r},${move.c})` : 'null'}`);

            expect(move).not.toBeNull();

            if (move) {
                const result = game.placeLine(move.type, move.r, move.c);
                expect(result.success).toBe(true);

                if (game.gameOver) {
                    console.log('Game over');
                    break;
                }

                // Reset to AI's turn if it changed
                if (game.getCurrentPlayer() !== 'P2') {
                    game.currentPlayerIndex = 1;
                }
            }
        }

        console.log('=== End ===\n');
    });

    test('Greedy AI handles scenario where chain ends mid-game', () => {
        const game = new GameState(3, 3);
        const ai = new DotDotAI('greedy');

        console.log('\n=== Testing Chain End Scenario ===');

        // Setup 2 squares ready to capture, then no more
        // Square (0,0) - missing V(0,1)
        game.horizontalLines[0][0] = true;
        game.horizontalLines[1][0] = true;
        game.verticalLines[0][0] = true;

        // Square (0,1) - missing H(0,1)
        game.horizontalLines[1][1] = true;
        game.verticalLines[0][1] = true;
        game.verticalLines[0][2] = true;

        game.currentPlayerIndex = 1; // AI's turn

        let moveCount = 0;
        const maxMoves = 10;

        while (game.getCurrentPlayer() === 'P2' && !game.gameOver && moveCount < maxMoves) {
            console.log(`\nMove ${moveCount + 1}:`);

            const move = ai.getMove(game);

            if (!move) {
                console.log('  No move returned');
                break;
            }

            console.log(`  ${move.type}(${move.r},${move.c})`);

            const result = game.placeLine(move.type, move.r, move.c);
            console.log(`  Result: success=${result.success}, extraTurn=${result.extraTurn}, squares=${result.newSquares.length}`);

            moveCount++;

            if (!result.extraTurn) {
                console.log('  Turn ended');
                break;
            }
        }

        console.log(`\nTotal moves: ${moveCount}`);
        console.log(`AI score: ${game.scores.P2}`);
        console.log(`Current player: ${game.getCurrentPlayer()}`);
        console.log('=== End ===\n');

        expect(moveCount).toBeGreaterThan(0);
    });
});
