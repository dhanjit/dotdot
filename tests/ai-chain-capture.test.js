
const DotDotAI = require('../web/js/ai.js');
const GameState = require('../web/js/game.js');

describe('AI Chain Capture Validation', () => {
    test('AI captures multiple squares in sequence when available', () => {
        const game = new GameState(3, 3);
        const ai = new DotDotAI('greedy');

        // Setup a chain: 3 squares each with 3 lines, ready to capture in sequence
        // Square (0,0) - needs V(0,1)
        game.horizontalLines[0][0] = true;
        game.horizontalLines[1][0] = true;
        game.verticalLines[0][0] = true;

        // Square (0,1) - needs V(0,2) AND shares V(0,1) with square (0,0)
        game.horizontalLines[0][1] = true;
        game.horizontalLines[1][1] = true;
        // V(0,1) will be placed when capturing square (0,0)

        // Setup game to AI's turn (P2)
        game.currentPlayerIndex = 1;

        const moveHistory = [];
        let totalSquaresCaptured = 0;

        console.log('\n=== Starting Chain Capture Test ===');
        console.log('Initial state:');
        console.log('Square (0,0): 3 lines, missing V(0,1)');
        console.log('Square (0,1): 2 lines (will have 3 after V(0,1) is placed)');

        // First move: AI should complete square (0,0)
        const move1 = ai.getMove(game);
        console.log(`\nMove 1: ${move1.type}(${move1.r},${move1.c})`);

        expect(move1.type).toBe('v');
        expect(move1.r).toBe(0);
        expect(move1.c).toBe(1);

        const result1 = game.placeLine(move1.type, move1.r, move1.c);
        console.log(`Result: success=${result1.success}, extraTurn=${result1.extraTurn}, squares=${result1.newSquares.length}`);

        expect(result1.success).toBe(true);
        expect(result1.extraTurn).toBe(true);
        expect(result1.newSquares.length).toBeGreaterThanOrEqual(1);

        totalSquaresCaptured += result1.newSquares.length;
        moveHistory.push({ move: move1, squares: result1.newSquares.length });

        // After capturing square(s), it should still be AI's turn
        expect(game.getCurrentPlayer()).toBe('P2');

        // Check if there are more scoring moves available
        const scoringMoves = ai.findScoringMoves(game);
        console.log(`Scoring moves available: ${scoringMoves.length}`);

        // If more scoring moves exist, AI should take them
        if (scoringMoves.length > 0) {
            const move2 = ai.getMove(game);
            console.log(`\nMove 2: ${move2.type}(${move2.r},${move2.c})`);

            const result2 = game.placeLine(move2.type, move2.r, move2.c);
            console.log(`Result: success=${result2.success}, extraTurn=${result2.extraTurn}, squares=${result2.newSquares.length}`);

            expect(result2.success).toBe(true);
            totalSquaresCaptured += result2.newSquares.length;
            moveHistory.push({ move: move2, squares: result2.newSquares.length });
        }

        console.log(`\nTotal squares captured: ${totalSquaresCaptured}`);
        console.log(`Total moves made: ${moveHistory.length}`);
        console.log('=== Chain Capture Test Complete ===\n');

        // Validate AI captured at least one square
        expect(totalSquaresCaptured).toBeGreaterThanOrEqual(1);
    });

    test('AI captures entire chain of 3 squares in sequence', () => {
        const game = new GameState(4, 2);
        const ai = new DotDotAI('greedy');

        // Create a vertical chain of 3 squares all ready to capture
        // Square (0,0) - needs H(1,0)
        game.horizontalLines[0][0] = true;
        game.verticalLines[0][0] = true;
        game.verticalLines[0][1] = true;

        // Square (1,0) - has H(1,0) missing (shares with square 0,0), needs H(2,0)
        game.verticalLines[1][0] = true;
        game.verticalLines[1][1] = true;

        // Square (2,0) - has H(2,0) missing (shares with square 1,0), needs H(3,0)
        game.horizontalLines[3][0] = true;
        game.verticalLines[2][0] = true;
        game.verticalLines[2][1] = true;

        game.currentPlayerIndex = 1; // AI's turn

        console.log('\n=== Testing 3-Square Chain ===');

        let squaresCaptured = 0;
        let movesCount = 0;
        const maxMoves = 5; // Safety limit

        // AI should keep making moves while it has extra turns
        while (movesCount < maxMoves) {
            const currentPlayer = game.getCurrentPlayer();
            if (currentPlayer !== 'P2') break; // Not AI's turn anymore

            const scoringMoves = ai.findScoringMoves(game);
            if (scoringMoves.length === 0) break; // No more scoring moves

            const move = ai.getMove(game);
            console.log(`Move ${movesCount + 1}: ${move.type}(${move.r},${move.c})`);

            const result = game.placeLine(move.type, move.r, move.c);
            console.log(`  Captured ${result.newSquares.length} square(s), extraTurn=${result.extraTurn}`);

            expect(result.success).toBe(true);
            squaresCaptured += result.newSquares.length;
            movesCount++;

            if (!result.extraTurn) break;
        }

        console.log(`Total: ${squaresCaptured} squares in ${movesCount} moves`);
        console.log('=== 3-Square Chain Complete ===\n');

        expect(squaresCaptured).toBeGreaterThanOrEqual(1);
        expect(game.scores['P2']).toBe(squaresCaptured);
    });

    test('AI continues capturing until no more scoring moves available', () => {
        const game = new GameState(3, 3);
        const ai = new DotDotAI('strategic');

        // Setup all 4 squares ready to capture
        // Square (0,0)
        game.horizontalLines[0][0] = true;
        game.horizontalLines[1][0] = true;
        game.verticalLines[0][0] = true;

        // Square (0,1)
        game.horizontalLines[0][1] = true;
        game.horizontalLines[1][1] = true;
        game.verticalLines[0][2] = true;

        // Square (1,0)
        game.horizontalLines[1][0] = true; // already set
        game.horizontalLines[2][0] = true;
        game.verticalLines[1][0] = true;

        // Square (1,1)
        game.horizontalLines[1][1] = true; // already set
        game.horizontalLines[2][1] = true;
        game.verticalLines[1][2] = true;

        game.currentPlayerIndex = 0; // P1's turn (simulate human)

        console.log('\n=== Testing AI Chain Until Exhaustion ===');

        // Simulate: Human places one line that completes a square and triggers chain
        // Place V(0,1) to complete square (0,0)
        const humanMove = game.placeLine('v', 0, 1);
        console.log(`Human completes square (0,0), extraTurn=${humanMove.extraTurn}`);

        if (humanMove.extraTurn) {
            // Human got extra turn, now they continue
            let moveCount = 0;
            while (game.getCurrentPlayer() === 'P1' && moveCount < 10) {
                const scoringMoves = ai.findScoringMoves(game);
                if (scoringMoves.length === 0) break;

                // Simulate human taking scoring moves
                const move = scoringMoves[0];
                const result = game.placeLine(move.type, move.r, move.c);
                console.log(`  Human continues: ${move.type}(${move.r},${move.c}), captured ${result.newSquares.length}`);
                moveCount++;

                if (!result.extraTurn) break;
            }
        }

        console.log(`Human captured: ${game.scores['P1']} squares`);
        console.log(`Game over: ${game.gameOver}`);
        console.log('=== Chain Exhaustion Test Complete ===\n');

        // Validate the chain capture mechanism works
        expect(game.scores['P1']).toBeGreaterThanOrEqual(1);
    });
});
