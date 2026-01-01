
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
});
