
const DotDotAI = require('../web/js/ai.js');
const GameState = require('../web/js/game.js');

describe('AI Diagnostic Tests - Bug Detection', () => {
    test('Verify AI always prioritizes scoring over safe moves', () => {
        const game = new GameState(3, 3);
        const ai = new DotDotAI('greedy');

        // Setup: One square ready to complete (3 lines)
        game.horizontalLines[0][0] = true;
        game.horizontalLines[1][0] = true;
        game.verticalLines[0][0] = true;
        // Missing V(0,1) completes square (0,0)

        // Also setup a safe move available elsewhere
        // This ensures we have both scoring and safe moves

        const scoringMoves = ai.findScoringMoves(game);
        const safeMoves = ai.findSafeMoves(game);

        expect(scoringMoves.length).toBeGreaterThan(0);
        expect(safeMoves.length).toBeGreaterThan(0);

        // AI should pick the scoring move
        const move = ai.getMove(game);
        const isScoring = scoringMoves.some(m =>
            m.type === move.type && m.r === move.r && m.c === move.c
        );

        expect(isScoring).toBe(true);
    });

    test('Verify AI handles chain scenarios correctly', () => {
        const game = new GameState(4, 4);
        const ai = new DotDotAI('strategic');

        // Play several moves and verify AI never makes obviously bad choices
        for (let i = 0; i < 20; i++) {
            const move = ai.getMove(game);
            if (!move) break;

            const scoringMoves = ai.findScoringMoves(game);

            // If scoring moves exist, AI must pick one
            if (scoringMoves.length > 0) {
                const isScoring = scoringMoves.some(m =>
                    m.type === move.type && m.r === move.r && m.c === move.c
                );
                expect(isScoring).toBe(true);
            }

            game.placeLine(move.type, move.r, move.c);
            if (game.gameOver) break;
        }
    });

    test('Detect if AI misses obvious scoring opportunities', () => {
        const game = new GameState(3, 3);
        const ai = new DotDotAI('greedy');

        // Setup multiple NON-ADJACENT squares ready to complete
        // Square (0,0) - needs V(0,1)
        game.horizontalLines[0][0] = true;
        game.horizontalLines[1][0] = true;
        game.verticalLines[0][0] = true;
        // Missing V(0,1)

        // Square (1,1) - needs V(1,2)
        game.horizontalLines[1][1] = true;
        game.horizontalLines[2][1] = true;
        game.verticalLines[1][1] = true;
        // Missing V(1,2)

        // AI should find both scoring moves
        const scoringMoves = ai.findScoringMoves(game);
        expect(scoringMoves.length).toBe(2);

        // Verify the scoring moves are correct
        const hasV01 = scoringMoves.some(m => m.type === 'v' && m.r === 0 && m.c === 1);
        const hasV12 = scoringMoves.some(m => m.type === 'v' && m.r === 1 && m.c === 2);

        expect(hasV01).toBe(true);
        expect(hasV12).toBe(true);
    });

    test('Verify AI does not confuse horizontal and vertical lines', () => {
        const game = new GameState(3, 3);
        const ai = new DotDotAI('greedy');

        // Setup square (0,0) missing HORIZONTAL bottom line
        game.horizontalLines[0][0] = true; // Top
        game.verticalLines[0][0] = true;   // Left
        game.verticalLines[0][1] = true;   // Right
        // Missing: horizontalLines[1][0] (bottom)

        const move = ai.getMove(game);

        // Should complete with HORIZONTAL line, not vertical
        expect(move.type).toBe('h');
        expect(move.r).toBe(1);
        expect(move.c).toBe(0);
    });

    test('Verify AI correctly counts lines for edge squares', () => {
        const game = new GameState(3, 3);
        const ai = new DotDotAI('greedy');

        // Test top-left corner square (0,0)
        game.horizontalLines[0][0] = true;
        expect(ai.countLinesAroundSquare(game, 0, 0)).toBe(1);

        // Test bottom-right corner square (1,1)
        game.horizontalLines[2][1] = true;
        expect(ai.countLinesAroundSquare(game, 1, 1)).toBe(1);

        game.verticalLines[1][2] = true;
        expect(ai.countLinesAroundSquare(game, 1, 1)).toBe(2);
    });

    test('Verify doesMoveGiveAwaySquare correctly handles edge cases', () => {
        const game = new GameState(3, 3);
        const ai = new DotDotAI('greedy');

        // Square with 0 lines - adding one should be safe
        expect(ai.doesMoveGiveAwaySquare(game, { type: 'h', r: 0, c: 0 })).toBe(false);

        // Square with 1 line - adding second should be safe
        game.horizontalLines[0][0] = true;
        expect(ai.doesMoveGiveAwaySquare(game, { type: 'v', r: 0, c: 0 })).toBe(false);

        // Square with 2 lines - adding third is a giveaway
        game.verticalLines[0][0] = true;
        expect(ai.doesMoveGiveAwaySquare(game, { type: 'h', r: 1, c: 0 })).toBe(true);
        expect(ai.doesMoveGiveAwaySquare(game, { type: 'v', r: 0, c: 1 })).toBe(true);

        // Square with 3 lines - adding fourth is scoring (not giveaway)
        game.horizontalLines[1][0] = true;
        expect(ai.doesMoveGiveAwaySquare(game, { type: 'v', r: 0, c: 1 })).toBe(false);
    });

    test('Stress test: Verify AI completes entire games without errors', () => {
        for (let gridSize = 2; gridSize <= 5; gridSize++) {
            const game = new GameState(gridSize, gridSize);
            const ai = new DotDotAI('greedy');

            let moveCount = 0;
            const maxMoves = gridSize * gridSize * 4; // Upper bound on moves

            while (!game.gameOver && moveCount < maxMoves) {
                const move = ai.getMove(game);
                expect(move).toBeDefined();

                const result = game.placeLine(move.type, move.r, move.c);
                expect(result.success).toBe(true);

                moveCount++;
            }

            expect(game.gameOver).toBe(true);
            expect(game.occupiedSquares).toBe(game.totalSquares);
        }
    });

    test('Strategic AI minimizes 2-line squares when picking safe moves', () => {
        const game = new GameState(3, 3);
        const ai = new DotDotAI('strategic');

        // Setup: One square with 1 line, rest empty
        game.horizontalLines[0][0] = true;

        // Create a move that would make square (0,0) have 2 lines
        const dangerousMove = { type: 'v', r: 0, c: 0 };

        // Create a move that doesn't affect square (0,0)
        const safeMove = { type: 'h', r: 2, c: 1 };

        const safeMoves = [dangerousMove, safeMove];

        // pickBestSafeMove should prefer the move that doesn't create 2-line squares
        const chosenMove = ai.pickBestSafeMove(game, safeMoves);

        // Verify the chosen move doesn't create a 2-line square on (0,0)
        const affectedSquares = ai.getAffectedSquares(game, chosenMove);
        let creates2LineSquare = false;

        for (const sq of affectedSquares) {
            if (ai.countLinesAroundSquare(game, sq.r, sq.c) === 1) {
                creates2LineSquare = true;
            }
        }

        // The best move should avoid creating 2-line squares when possible
        expect(creates2LineSquare).toBe(false);
    });

    test('Strategic AI minimizes 3-line squares when forced to sacrifice', () => {
        const game = new GameState(3, 3);
        const ai = new DotDotAI('strategic');

        // Setup two squares with 2 lines each
        // Square (0,0)
        game.horizontalLines[0][0] = true;
        game.verticalLines[0][0] = true;

        // Square (1,1)
        game.horizontalLines[1][1] = true;
        game.verticalLines[1][1] = true;

        // Fill other areas to force sacrifice
        game.horizontalLines[0][1] = true;
        game.horizontalLines[2][0] = true;
        game.horizontalLines[2][1] = true;
        game.verticalLines[0][2] = true;
        game.verticalLines[1][0] = true;
        game.verticalLines[1][2] = true;

        const move = ai.getMove(game);
        expect(move).toBeDefined();

        // Count how many 3-line squares this creates
        const affectedSquares = ai.getAffectedSquares(game, move);
        let threeLineSquares = 0;

        for (const sq of affectedSquares) {
            if (ai.countLinesAroundSquare(game, sq.r, sq.c) === 2) {
                threeLineSquares++;
            }
        }

        // Should minimize giveaways (ideally 1, not 2)
        expect(threeLineSquares).toBeLessThanOrEqual(1);
    });

    test('getAffectedSquares correctly identifies affected squares', () => {
        const game = new GameState(3, 3);
        const ai = new DotDotAI('greedy');

        // Horizontal line H(1,0) affects squares (0,0) above and (1,0) below
        const hMove = { type: 'h', r: 1, c: 0 };
        const hAffected = ai.getAffectedSquares(game, hMove);
        expect(hAffected.length).toBe(2);
        expect(hAffected).toContainEqual({ r: 0, c: 0 });
        expect(hAffected).toContainEqual({ r: 1, c: 0 });

        // Vertical line V(0,1) affects squares (0,0) left and (0,1) right
        const vMove = { type: 'v', r: 0, c: 1 };
        const vAffected = ai.getAffectedSquares(game, vMove);
        expect(vAffected.length).toBe(2);
        expect(vAffected).toContainEqual({ r: 0, c: 0 });
        expect(vAffected).toContainEqual({ r: 0, c: 1 });
    });
});
