
const DotDotAI = require('../web/js/ai.js');
const GameState = require('../web/js/game.js');

describe('AI vs AI Gameplay', () => {
    function playAIvsAI(difficulty1, difficulty2, gridSize = { rows: 5, cols: 5 }, gameNumber = 1) {
        const game = new GameState(gridSize.rows, gridSize.cols);
        const ai1 = new DotDotAI(difficulty1);
        const ai2 = new DotDotAI(difficulty2);

        console.log(`\n${'='.repeat(60)}`);
        console.log(`Game ${gameNumber}: ${difficulty1} (P1) vs ${difficulty2} (P2) on ${gridSize.rows}x${gridSize.cols} grid`);
        console.log('='.repeat(60));

        let totalMoves = 0;
        const maxMoves = 1000; // Safety limit
        let consecutiveNullMoves = 0;
        let lastPlayer = null;
        let chainMoves = 0;

        while (!game.gameOver && totalMoves < maxMoves) {
            const currentPlayer = game.getCurrentPlayer();
            const ai = currentPlayer === 'P1' ? ai1 : ai2;
            const difficulty = currentPlayer === 'P1' ? difficulty1 : difficulty2;

            // Track if same player is moving consecutively (chain capture)
            if (lastPlayer === currentPlayer) {
                chainMoves++;
            } else {
                if (chainMoves > 0) {
                    console.log(`  [Chain ended: ${lastPlayer} made ${chainMoves + 1} consecutive moves]`);
                }
                chainMoves = 0;
            }

            // Get scoring moves to see what's available
            const scoringMoves = ai.findScoringMoves(game);
            const safeMoves = ai.findSafeMoves(game);
            const totalAvailable = scoringMoves.length + safeMoves.length;

            console.log(`\nMove ${totalMoves + 1}: ${currentPlayer} (${difficulty}) - Available: ${totalAvailable} (${scoringMoves.length} scoring, ${safeMoves.length} safe)`);

            // Get AI move
            const move = ai.getMove(game);

            if (!move) {
                console.error(`  ERROR: AI returned null move!`);
                console.error(`  Game state: player=${currentPlayer}, gameOver=${game.gameOver}, moves available=${totalAvailable}`);
                console.error(`  Scores: P1=${game.scores.P1}, P2=${game.scores.P2}`);

                consecutiveNullMoves++;

                if (consecutiveNullMoves > 2) {
                    throw new Error(`AI returned null move ${consecutiveNullMoves} times in a row - game stuck!`);
                }

                // Try to continue with other player
                game.currentPlayerIndex = (game.currentPlayerIndex + 1) % 2;
                continue;
            }

            consecutiveNullMoves = 0;

            console.log(`  ${currentPlayer} plays: ${move.type}(${move.r},${move.c})`);

            // Place the move
            const result = game.placeLine(move.type, move.r, move.c);

            if (!result.success) {
                console.error(`  ERROR: Move failed!`);
                console.error(`  Move: ${move.type}(${move.r},${move.c})`);
                throw new Error('AI made invalid move');
            }

            console.log(`  Result: ${result.newSquares.length} square(s) captured, extraTurn=${result.extraTurn}`);

            totalMoves++;
            lastPlayer = currentPlayer;

            // If no extra turn and we were in a chain, log it
            if (!result.extraTurn && chainMoves > 0) {
                console.log(`  [Chain ended: ${currentPlayer} made ${chainMoves + 1} consecutive moves]`);
                chainMoves = 0;
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`Game ${gameNumber} Complete!`);
        console.log(`Total moves: ${totalMoves}`);
        console.log(`Final scores: P1=${game.scores.P1}, P2=${game.scores.P2}`);
        console.log(`Winner: ${game.winner}`);
        console.log('='.repeat(60));

        return {
            totalMoves,
            winner: game.winner,
            scores: { ...game.scores },
            completed: game.gameOver,
            hitMaxMoves: totalMoves >= maxMoves
        };
    }

    test('Greedy vs Greedy - Single game', () => {
        const result = playAIvsAI('greedy', 'greedy', { rows: 4, cols: 4 }, 1);

        expect(result.completed).toBe(true);
        expect(result.hitMaxMoves).toBe(false);
        expect(result.totalMoves).toBeGreaterThan(0);
    });

    test('Greedy vs Greedy - 5 games', () => {
        console.log('\n\n' + '='.repeat(70));
        console.log('RUNNING 5 GREEDY vs GREEDY GAMES');
        console.log('='.repeat(70));

        const results = [];

        for (let i = 0; i < 5; i++) {
            const result = playAIvsAI('greedy', 'greedy', { rows: 5, cols: 5 }, i + 1);
            results.push(result);

            expect(result.completed).toBe(true);
            expect(result.hitMaxMoves).toBe(false);
        }

        console.log('\n\n' + '='.repeat(70));
        console.log('SUMMARY OF 5 GAMES');
        console.log('='.repeat(70));
        results.forEach((r, i) => {
            console.log(`Game ${i + 1}: ${r.totalMoves} moves, Winner: ${r.winner} (P1: ${r.scores.P1}, P2: ${r.scores.P2})`);
        });
        console.log('='.repeat(70));
    });

    test('Strategic vs Strategic - 3 games', () => {
        console.log('\n\n' + '='.repeat(70));
        console.log('RUNNING 3 STRATEGIC vs STRATEGIC GAMES');
        console.log('='.repeat(70));

        const results = [];

        for (let i = 0; i < 3; i++) {
            const result = playAIvsAI('strategic', 'strategic', { rows: 4, cols: 4 }, i + 1);
            results.push(result);

            expect(result.completed).toBe(true);
            expect(result.hitMaxMoves).toBe(false);
        }

        console.log('\n\n' + '='.repeat(70));
        console.log('SUMMARY OF 3 GAMES');
        console.log('='.repeat(70));
        results.forEach((r, i) => {
            console.log(`Game ${i + 1}: ${r.totalMoves} moves, Winner: ${r.winner} (P1: ${r.scores.P1}, P2: ${r.scores.P2})`);
        });
        console.log('='.repeat(70));
    });

    test('Greedy vs Strategic - 3 games', () => {
        console.log('\n\n' + '='.repeat(70));
        console.log('RUNNING 3 GREEDY vs STRATEGIC GAMES');
        console.log('='.repeat(70));

        const results = [];

        for (let i = 0; i < 3; i++) {
            const result = playAIvsAI('greedy', 'strategic', { rows: 5, cols: 5 }, i + 1);
            results.push(result);

            expect(result.completed).toBe(true);
            expect(result.hitMaxMoves).toBe(false);
        }

        console.log('\n\n' + '='.repeat(70));
        console.log('SUMMARY OF 3 GAMES');
        console.log('='.repeat(70));
        results.forEach((r, i) => {
            console.log(`Game ${i + 1}: ${r.totalMoves} moves, Winner: ${r.winner} (P1: ${r.scores.P1}, P2: ${r.scores.P2})`);
        });
        console.log('='.repeat(70));
    });

    test('Large grid stress test - Greedy vs Greedy on 10x10', () => {
        console.log('\n\n' + '='.repeat(70));
        console.log('STRESS TEST: 10x10 GRID');
        console.log('='.repeat(70));

        const result = playAIvsAI('greedy', 'greedy', { rows: 10, cols: 10 }, 1);

        expect(result.completed).toBe(true);
        expect(result.hitMaxMoves).toBe(false);
        expect(result.scores.P1 + result.scores.P2).toBe(9 * 9); // All squares should be captured
    });
});
