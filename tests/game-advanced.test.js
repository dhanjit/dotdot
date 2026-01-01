
const GameState = require('../web/js/game.js');

describe('DotDot (Dots and Boxes) Advanced Scenarios', () => {

    test('Simulate a full small game (2x2 grid, 1 square)', () => {
        // 2x2 grid implies 1 square.
        const game = new GameState(2, 2);

        // Sq(0,0) needs H(0,0), H(1,0), V(0,0), V(0,1)

        // P1 moves
        let res = game.placeLine('h', 0, 0);
        expect(res.success).toBe(true);
        expect(game.getCurrentPlayer()).toBe('P2');

        // P2 moves
        res = game.placeLine('h', 1, 0);
        expect(res.success).toBe(true);
        expect(game.getCurrentPlayer()).toBe('P1');

        // P1 moves
        res = game.placeLine('v', 0, 0);
        expect(res.success).toBe(true);
        expect(game.getCurrentPlayer()).toBe('P2');

        // P2 makes winning move
        res = game.placeLine('v', 0, 1);
        expect(res.success).toBe(true);
        expect(res.extraTurn).toBe(true);
        expect(res.newSquares.length).toBe(1);

        expect(game.squares[0][0]).toBe('P2');
        expect(game.gameOver).toBe(true);
        expect(game.winner).toBe('P2');
    });

    test('Handling large grid performance check', () => {
        // Create 20x20 grid
        const start = performance.now();
        const game = new GameState(20, 20);
        const end = performance.now();
        expect(end - start).toBeLessThan(100); // Should be instant

        expect(game.squares.length).toBe(19);
        expect(game.squares[0].length).toBe(19);
    });

    test('Chaining multiple squares (Double Cross)', () => {
        // 3x3 grid (2x2 squares)
        // Setup:
        // .___.___
        // |   |   |
        // .   .   .
        // We set up top row of vertical lines and outside horizontal lines, 
        // leaving the middle horizontal line to complete TWO squares at once.

        const game = new GameState(3, 3);

        // Pre-fill
        game.horizontalLines[0][0] = true; // Top-left
        game.horizontalLines[0][1] = true; // Top-right
        game.horizontalLines[2][0] = true; // Bottom-left
        game.horizontalLines[2][1] = true; // Bottom-right

        game.verticalLines[0][0] = true; // Left-top
        game.verticalLines[0][1] = true; // Mid-top
        game.verticalLines[0][2] = true; // Right-top
        game.verticalLines[1][0] = true; // Left-bottom
        game.verticalLines[1][1] = true; // Mid-bottom
        game.verticalLines[1][2] = true; // Right-bottom

        // The only missing lines are H(1, 0) and H(1, 1).
        // Actually, we want ONE line to complete TWO squares.
        // The shared line between sq(0,0) and sq(1,0) is H(1, 0).
        // Let's set up sq(0,0) and sq(1,0).
        // sq(0,0): H(0,0), H(1,0), V(0,0), V(0,1)
        // sq(1,0): H(1,0), H(2,0), V(1,0), V(1,1)

        // Let's reset and be precise.
        const preciseGame = new GameState(3, 3);

        // Setup for Sq(0,0) EXCEPT bottom line H(1,0)
        preciseGame.horizontalLines[0][0] = true;
        preciseGame.verticalLines[0][0] = true;
        preciseGame.verticalLines[0][1] = true;

        // Setup for Sq(1,0) EXCEPT top line H(1,0)
        preciseGame.horizontalLines[2][0] = true;
        preciseGame.verticalLines[1][0] = true;
        preciseGame.verticalLines[1][1] = true;

        // So placing H(1,0) should close BOTH Sq(0,0) and Sq(1,0)
        const result = preciseGame.placeLine('h', 1, 0);

        expect(result.success).toBe(true);
        expect(result.extraTurn).toBe(true);
        expect(result.newSquares.length).toBe(2);

        // Verify coordinates of captured squares
        const captured = result.newSquares;
        // Should contain {r:0, c:0} and {r:1, c:0}
        expect(captured).toContainEqual({ r: 0, c: 0 });
        expect(captured).toContainEqual({ r: 1, c: 0 });

        expect(preciseGame.scores[preciseGame.getCurrentPlayer()]).toBe(2);
    });

});
