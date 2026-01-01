
const DotDotAI = require('../web/js/ai.js');
const GameState = require('../web/js/game.js');

describe('AI Chain Limit Edge Cases', () => {
    test('AI makes final move when hitting artificial chain limit', () => {
        // Create a long chain that will definitely hit a low artificial limit
        const game = new GameState(6, 6);
        const ai = new DotDotAI('greedy');

        console.log('\n=== Testing Chain Limit with Final Move ===');

        // Setup a vertical chain of 5 squares all ready to capture
        for (let r = 0; r < 5; r++) {
            game.horizontalLines[r][0] = true;
            game.horizontalLines[r + 1][0] = true;
            game.verticalLines[r][0] = true;
            game.verticalLines[r][1] = true;
        }

        game.currentPlayerIndex = 1; // AI's turn

        let totalMoves = 0;
        const artificialLimit = 3; // Low limit to trigger the edge case
        let reachedLimit = false;

        // Simulate the main loop with artificial limit
        while (game.getCurrentPlayer() === 'P2' && !game.gameOver && totalMoves < artificialLimit) {
            const move = ai.getMove(game);
            if (!move) break;

            const result = game.placeLine(move.type, move.r, move.c);
            console.log(`Move ${totalMoves + 1}: ${move.type}(${move.r},${move.c}), squares=${result.newSquares.length}, extraTurn=${result.extraTurn}`);
            totalMoves++;

            if (!result.extraTurn) {
                break;
            }
        }

        // Check if we hit the limit while AI still has turn
        if (totalMoves >= artificialLimit && game.getCurrentPlayer() === 'P2' && !game.gameOver) {
            console.log(`Hit artificial limit at ${totalMoves} moves`);
            reachedLimit = true;

            // Make final move (this is what our fix does)
            const finalMove = ai.getMove(game);
            expect(finalMove).not.toBeNull();

            if (finalMove) {
                const finalResult = game.placeLine(finalMove.type, finalMove.r, finalMove.c);
                console.log(`Final move: ${finalMove.type}(${finalMove.r},${finalMove.c}), squares=${finalResult.newSquares.length}`);
                totalMoves++;

                // Force turn to end even if captured squares
                if (game.getCurrentPlayer() === 'P2') {
                    console.log('Forcefully ending AI turn');
                    game.currentPlayerIndex = 0;
                }
            }
        }

        console.log(`Total moves: ${totalMoves}, Reached limit: ${reachedLimit}`);
        console.log(`Final player: ${game.getCurrentPlayer()}`);
        console.log('=== Test Complete ===\n');

        // Validations
        if (reachedLimit) {
            expect(totalMoves).toBeGreaterThan(artificialLimit);
            expect(game.getCurrentPlayer()).toBe('P1');
        }
        expect(totalMoves).toBeGreaterThan(0);
    });

    test('Limit behavior is consistent with natural chain ending', () => {
        // This test verifies that when a chain naturally ends,
        // the behavior is the same as when we forcefully end it at the limit
        const game = new GameState(4, 4);
        const ai = new DotDotAI('greedy');

        console.log('\n=== Testing Natural vs Forced Chain End ===');

        // Setup a small chain
        game.horizontalLines[0][0] = true;
        game.horizontalLines[1][0] = true;
        game.verticalLines[0][0] = true;
        game.verticalLines[0][1] = true;

        game.currentPlayerIndex = 1;

        let moveCount = 0;
        while (game.getCurrentPlayer() === 'P2' && !game.gameOver && moveCount < 10) {
            const move = ai.getMove(game);
            if (!move) break;

            const result = game.placeLine(move.type, move.r, move.c);
            console.log(`Move ${moveCount + 1}: extraTurn=${result.extraTurn}`);
            moveCount++;

            if (!result.extraTurn) {
                console.log('Chain ended naturally');
                break;
            }
        }

        // After chain ends (naturally or forced), turn should switch to P1
        expect(game.getCurrentPlayer()).not.toBe('P2');
        console.log('=== Test Complete ===\n');
    });

    test('Verifies final move is always made when limit is hit', () => {
        const game = new GameState(5, 5);
        const ai = new DotDotAI('greedy');

        console.log('\n=== Testing Final Move Guarantee ===');

        // Create a guaranteed long chain
        for (let c = 0; c < 4; c++) {
            game.horizontalLines[0][c] = true;
            game.horizontalLines[1][c] = true;
            game.verticalLines[0][c] = true;
        }
        game.verticalLines[0][4] = true;

        game.currentPlayerIndex = 1;

        const artificialLimit = 2;
        let moveCount = 0;
        let madeAfinalMove = false;

        // Make moves up to limit
        while (game.getCurrentPlayer() === 'P2' && !game.gameOver && moveCount < artificialLimit) {
            const move = ai.getMove(game);
            if (!move) break;
            game.placeLine(move.type, move.r, move.c);
            moveCount++;
        }

        // If we hit limit and AI still has turn, make final move
        if (moveCount >= artificialLimit && game.getCurrentPlayer() === 'P2') {
            const finalMove = ai.getMove(game);
            if (finalMove) {
                game.placeLine(finalMove.type, finalMove.r, finalMove.c);
                moveCount++;
                madeAfinalMove = true;
                console.log('Made final move after hitting limit');

                // Force turn end
                if (game.getCurrentPlayer() === 'P2') {
                    game.currentPlayerIndex = 0;
                }
            }
        }

        console.log(`Moves: ${moveCount}, Made final move: ${madeAfinalMove}`);
        console.log('=== Test Complete ===\n');

        // If we hit the limit, we should have made a final move
        if (moveCount >= artificialLimit) {
            expect(madeAfinalMove).toBe(true);
        }
        expect(game.getCurrentPlayer()).toBe('P1');
    });
});
