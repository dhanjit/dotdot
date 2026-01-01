
const DotDotAI = require('../web/js/ai.js');
const GameState = require('../web/js/game.js');

describe('DotDot AI Logic', () => {
    let ai;
    let game;

    beforeEach(() => {
        ai = new DotDotAI('greedy');
        game = new GameState(3, 3); // 3x3 dots = 2x2 squares
    });

    test('Greedy AI takes a square when available - Horizontal', () => {
        // Setup: Square (0,0) needs only H(1,0) to complete
        game.horizontalLines[0][0] = true; // Top
        game.verticalLines[0][0] = true;   // Left
        game.verticalLines[0][1] = true;   // Right
        // Bottom H(1,0) is missing

        const move = ai.getMove(game);

        expect(move.type).toBe('h');
        expect(move.r).toBe(1);
        expect(move.c).toBe(0);
    });

    test('Greedy AI takes a square when available - Vertical', () => {
        // Setup: Square (0,0) needs only V(0,1) to complete (Right side)
        game.horizontalLines[0][0] = true; // Top
        game.horizontalLines[1][0] = true; // Bottom
        game.verticalLines[0][0] = true;   // Left
        // Right V(0,1) is missing

        const move = ai.getMove(game);

        expect(move.type).toBe('v');
        expect(move.r).toBe(0);
        expect(move.c).toBe(1);
    });

    test('AI avoids giving away a square (Safe Move)', () => {
        // Setup: Square (0,0) has 2 lines.
        // Placing a 3rd line would leave it with 3 lines (Dangerous for next player).
        // AI should NOT pick the 3rd line if there are other safe moves.
        game.horizontalLines[0][0] = true; // Top
        game.verticalLines[0][0] = true;   // Left
        // square (0,0) has 2 lines.
        // Candidate Dangerous moves: H(1,0) [Bottom] and V(0,1) [Right]

        // We need another safe area.
        // Let's leave sq(1,1) completely empty.

        // Force AI to pick.
        const move = ai.getMove(game);

        // Ensure it didn't pick H(1,0) or V(0,1) for sq(0,0)
        // Check if move is NOT related to sq(0,0) danger
        const isDangerousH = (move.type === 'h' && move.r === 1 && move.c === 0);
        const isDangerousV = (move.type === 'v' && move.r === 0 && move.c === 1);

        expect(isDangerousH).toBe(false);
        expect(isDangerousV).toBe(false);
    });

    test('AI completes square that gives 2 points (double-cross)', () => {
        // Setup a line that completes 2 squares at once
        // Setup for Sq(0,0) EXCEPT bottom line H(1,0)
        game.horizontalLines[0][0] = true;
        game.verticalLines[0][0] = true;
        game.verticalLines[0][1] = true;

        // Setup for Sq(1,0) EXCEPT top line H(1,0)
        game.horizontalLines[2][0] = true;
        game.verticalLines[1][0] = true;
        game.verticalLines[1][1] = true;

        // AI should place H(1,0) to complete both squares
        const move = ai.getMove(game);
        expect(move.type).toBe('h');
        expect(move.r).toBe(1);
        expect(move.c).toBe(0);
    });

    test('Strategic AI avoids dangerous moves', () => {
        const strategicAI = new DotDotAI('strategic');
        // Setup: Square (0,0) has 2 lines (dangerous)
        game.horizontalLines[0][0] = true;
        game.verticalLines[0][0] = true;

        const move = strategicAI.getMove(game);

        // Should not be dangerous moves
        const isDangerousH = (move.type === 'h' && move.r === 1 && move.c === 0);
        const isDangerousV = (move.type === 'v' && move.r === 0 && move.c === 1);

        expect(isDangerousH).toBe(false);
        expect(isDangerousV).toBe(false);
    });

    test('AI makes valid moves when forced to sacrifice', () => {
        // All remaining moves give away a square
        game = new GameState(2, 2);

        // Place 3 lines around the only square
        game.horizontalLines[0][0] = true;
        game.horizontalLines[1][0] = true;
        game.verticalLines[0][0] = true;
        // Only V(0,1) remains

        const move = ai.getMove(game);
        expect(move).toBeDefined();

        const result = game.placeLine(move.type, move.r, move.c);
        expect(result.success).toBe(true);
    });

    test('AI does not make invalid or repeated moves', () => {
        const movesMade = new Set();

        for (let i = 0; i < 12; i++) { // 3x3 grid has 12 total lines
            const move = ai.getMove(game);
            expect(move).toBeDefined();

            const moveKey = `${move.type}-${move.r}-${move.c}`;
            expect(movesMade.has(moveKey)).toBe(false);
            movesMade.add(moveKey);

            const result = game.placeLine(move.type, move.r, move.c);
            expect(result.success).toBe(true);

            if (game.gameOver) break;
        }
    });

    test('countLinesAroundSquare works correctly', () => {
        // Test 0 lines
        expect(ai.countLinesAroundSquare(game, 0, 0)).toBe(0);

        // Test 1 line
        game.horizontalLines[0][0] = true;
        expect(ai.countLinesAroundSquare(game, 0, 0)).toBe(1);

        // Test 2 lines
        game.verticalLines[0][0] = true;
        expect(ai.countLinesAroundSquare(game, 0, 0)).toBe(2);

        // Test 3 lines
        game.horizontalLines[1][0] = true;
        expect(ai.countLinesAroundSquare(game, 0, 0)).toBe(3);

        // Test 4 lines (complete)
        game.verticalLines[0][1] = true;
        expect(ai.countLinesAroundSquare(game, 0, 0)).toBe(4);
    });

    test('AI handles rectangular grids correctly', () => {
        const rectGame = new GameState(4, 2);
        const move = ai.getMove(rectGame);

        expect(move).toBeDefined();
        const result = rectGame.placeLine(move.type, move.r, move.c);
        expect(result.success).toBe(true);
    });

    test('Strategic AI makes sacrifice when no safe moves exist', () => {
        const strategicAI = new DotDotAI('strategic');
        game = new GameState(3, 3);

        // Create scenario where all remaining moves give away a square (3rd line)
        // Square (0,0): 2 lines
        game.horizontalLines[0][0] = true;
        game.verticalLines[0][0] = true;

        // Square (0,1): 2 lines
        game.horizontalLines[0][1] = true;
        game.verticalLines[0][2] = true;

        // Square (1,0): 2 lines
        game.horizontalLines[2][0] = true;
        game.verticalLines[1][0] = true;

        // Square (1,1): 2 lines
        game.horizontalLines[2][1] = true;
        game.verticalLines[1][2] = true;

        // Any remaining move will add a 3rd line to at least one square
        const move = strategicAI.getMove(game);
        expect(move).toBeDefined();

        // Verify it's a valid but dangerous move
        const result = game.placeLine(move.type, move.r, move.c);
        expect(result.success).toBe(true);
        expect(result.extraTurn).toBe(false); // Should not complete a square
    });

    test('Full game simulation - AI vs AI', () => {
        const ai1 = new DotDotAI('greedy');
        const ai2 = new DotDotAI('strategic');
        const fullGame = new GameState(3, 3);

        let moveCount = 0;
        const maxMoves = 50;

        while (!fullGame.gameOver && moveCount < maxMoves) {
            const currentAI = fullGame.getCurrentPlayer() === 'P1' ? ai1 : ai2;
            const move = currentAI.getMove(fullGame);

            expect(move).toBeDefined();
            const result = fullGame.placeLine(move.type, move.r, move.c);
            expect(result.success).toBe(true);

            moveCount++;
        }

        expect(fullGame.gameOver).toBe(true);
        expect(moveCount).toBeLessThan(maxMoves);
    });
});
